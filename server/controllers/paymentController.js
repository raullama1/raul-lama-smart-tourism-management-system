// server/controllers/paymentController.js
import crypto from "crypto";
import axios from "axios";
import { createNotification } from "../models/notificationModel.js";
import {
  getBookingForPayment,
  markBookingPaid,
  getBookingNotificationInfo,
} from "../models/paymentModel.js";

function hmacBase64(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

function buildSignedString(obj, signedFieldNames) {
  return String(signedFieldNames || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => `${k}=${obj[k]}`)
    .join(",");
}

function normalizeStatus(s) {
  return String(s || "").trim().toUpperCase();
}

function makeTransactionUuid(bookingId, refCode) {
  const rand = crypto.randomBytes(6).toString("hex");
  return `BK-${bookingId}-${refCode}-${Date.now()}-${rand}`;
}

function extractBookingIdFromTxn(txn) {
  const m = String(txn || "").match(/^BK-(\d+)-/);
  return m ? Number(m[1]) : null;
}

function emitNotification(io, role, userId, notification) {
  if (!io || !notification || !role || !userId) return;
  io.to(`acct:${role}:${Number(userId)}`).emit("notification:new", notification);
  io.to(`acct:${role}:${Number(userId)}`).emit("notification:refresh");
}

async function verifyEsewaStatus({ product_code, total_amount, transaction_uuid }) {
  const statusUrl =
    process.env.ESEWA_STATUS_URL || "https://rc.esewa.com.np/api/epay/transaction/status/";

  try {
    const url = statusUrl.endsWith("/") ? statusUrl : `${statusUrl}/`;
    const r = await axios.get(url, {
      params: { product_code, total_amount, transaction_uuid },
      timeout: 8000,
    });

    const st = normalizeStatus(r?.data?.status);
    return { ok: st === "COMPLETE" || st === "COMPLETED", raw: r?.data };
  } catch (e) {
    return { ok: false, raw: null, error: e?.message || "verify_failed" };
  }
}

export async function initiateEsewaPayment(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    if (!bookingId) return res.status(400).json({ message: "bookingId is required." });

    const booking = await getBookingForPayment(userId, bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (booking.booking_status !== "Approved" || booking.payment_status !== "Unpaid") {
      return res.status(400).json({ message: "Payment not allowed for this booking." });
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
    const secretKey = process.env.ESEWA_SECRET_KEY || "";
    const formUrl = process.env.ESEWA_FORM_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

    const total = Number(booking.total_price || 0);
    if (!total || total < 1) {
      return res.status(400).json({ message: "Invalid total amount." });
    }

    const transactionUuid = makeTransactionUuid(booking.id, booking.ref_code);
    const apiBase = process.env.API_BASE_URL || "http://localhost:5001";

    const payload = {
      amount: String(total),
      tax_amount: "0",
      total_amount: String(total),
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${apiBase}/api/payments/esewa/success`,
      failure_url: `${apiBase}/api/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: "",
    };

    const toSign = buildSignedString(payload, payload.signed_field_names);
    payload.signature = hmacBase64(secretKey, toSign);

    return res.json({ data: { esewaUrl: formUrl, formData: payload } });
  } catch (err) {
    console.error("initiateEsewaPayment error:", err);
    return res.status(500).json({ message: "Failed to initiate eSewa payment." });
  }
}

export async function esewaSuccess(req, res) {
  try {
    const dataB64 = req.query.data;
    if (!dataB64) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0?reason=missing_data`);
    }

    const decoded = Buffer.from(String(dataB64), "base64").toString("utf8");
    const body = JSON.parse(decoded);

    const secretKey = process.env.ESEWA_SECRET_KEY || "";
    const signedNames = body.signed_field_names;
    const signedStr = buildSignedString(body, signedNames);
    const expectedSig = hmacBase64(secretKey, signedStr);

    if (expectedSig !== body.signature) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0?reason=signature_mismatch`);
    }

    const bookingId = extractBookingIdFromTxn(body.transaction_uuid);
    if (!bookingId) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0?reason=bad_txn_uuid`);
    }

    let statusOk =
      normalizeStatus(body.status) === "COMPLETE" || normalizeStatus(body.status) === "COMPLETED";

    const verify = await verifyEsewaStatus({
      product_code: body.product_code,
      total_amount: body.total_amount,
      transaction_uuid: body.transaction_uuid,
    });

    if (verify.ok) statusOk = true;

    if (!statusOk) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure/${bookingId}?reason=not_complete`);
    }

    await markBookingPaid(bookingId);

    const info = await getBookingNotificationInfo(bookingId);
    if (info) {
      const io = req.app.get("io");

      const touristNotification = await createNotification({
        userId: Number(info.user_id),
        receiverRole: "tourist",
        type: "payment_success",
        title: "Payment successful",
        message: `Payment successful for booking ${info.ref_code}. Your ${info.tour_title} trip is confirmed.`,
        actionPath: `/bookings`,
        actionLabel: "View booking",
        meta: {
          bookingId: Number(info.id),
          refCode: info.ref_code,
        },
      });

      emitNotification(io, "tourist", info.user_id, touristNotification);

      const agencyNotification = await createNotification({
        userId: Number(info.agency_id),
        receiverRole: "agency",
        type: "payment_received",
        title: "Payment received",
        message: `Payment was completed for booking ${info.ref_code} (${info.tour_title}).`,
        actionPath: `/agency/bookings`,
        actionLabel: "View bookings",
        meta: {
          bookingId: Number(info.id),
          refCode: info.ref_code,
        },
      });

      emitNotification(io, "agency", info.agency_id, agencyNotification);
    }

    return res.redirect(`${process.env.CLIENT_URL}/payment/success/${bookingId}`);
  } catch (err) {
    console.error("esewaSuccess error:", err);
    return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0?reason=server_error`);
  }
}

export async function esewaFailure(req, res) {
  try {
    const dataB64 = req.query.data;
    if (!dataB64) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0?reason=cancelled`);
    }

    const decoded = Buffer.from(String(dataB64), "base64").toString("utf8");
    const body = JSON.parse(decoded);

    const bookingId = extractBookingIdFromTxn(body.transaction_uuid) || 0;
    return res.redirect(`${process.env.CLIENT_URL}/payment/failure/${bookingId}?reason=cancelled`);
  } catch {
    return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0?reason=cancelled`);
  }
}