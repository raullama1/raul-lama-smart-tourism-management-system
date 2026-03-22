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
  return crypto
    .createHmac("sha256", String(secret || ""))
    .update(String(message), "utf8")
    .digest("base64");
}

function buildSignedString(obj, signedFieldNames) {
  return String(signedFieldNames || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => `${k}=${String(obj[k] ?? "")}`)
    .join(",");
}

function normalizeStatus(s) {
  return String(s || "").trim().toUpperCase();
}

function normalizeEsewaAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function makeTransactionUuid(bookingId) {
  const rand = crypto.randomBytes(6).toString("hex");
  return `BK-${Number(bookingId)}-${Date.now()}-${rand}`;
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

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const v = String(value || "").trim();
    if (v) return v;
  }
  return null;
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function getEsewaConfig() {
  const mode = String(process.env.ESEWA_MODE || "test").trim().toLowerCase();
  const isProd = mode === "prod" || mode === "production";

  return {
    productCode: String(process.env.ESEWA_PRODUCT_CODE || "EPAYTEST").trim(),
    secretKey: String(process.env.ESEWA_SECRET_KEY || ""),
    formUrl: String(
      process.env.ESEWA_FORM_URL ||
        (isProd
          ? "https://epay.esewa.com.np/api/epay/main/v2/form"
          : "https://rc-epay.esewa.com.np/api/epay/main/v2/form")
    ).trim(),
    statusUrl: String(
      process.env.ESEWA_STATUS_URL ||
        (isProd
          ? "https://epay.esewa.com.np/api/epay/transaction/status/"
          : "https://uat.esewa.com.np/api/epay/transaction/status/")
    ).trim(),
  };
}

async function verifyEsewaStatus({
  product_code,
  total_amount,
  transaction_uuid,
}) {
  const { statusUrl } = getEsewaConfig();

  try {
    const url = statusUrl.endsWith("/") ? statusUrl : `${statusUrl}/`;

    const r = await axios.get(url, {
      params: { product_code, total_amount, transaction_uuid },
      timeout: 10000,
    });

    const st = normalizeStatus(r?.data?.status);

    return {
      ok: st === "COMPLETE" || st === "COMPLETED",
      raw: r?.data || null,
    };
  } catch (e) {
    console.error("verifyEsewaStatus error:", e?.response?.data || e?.message || e);
    return {
      ok: false,
      raw: e?.response?.data || null,
      error: e?.message || "verify_failed",
    };
  }
}

export async function initiateEsewaPayment(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required." });
    }

    const booking = await getBookingForPayment(userId, bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (
      booking.booking_status !== "Approved" ||
      booking.payment_status !== "Unpaid"
    ) {
      return res
        .status(400)
        .json({ message: "Payment not allowed for this booking." });
    }

    const { productCode, secretKey, formUrl } = getEsewaConfig();

    if (!secretKey) {
      return res.status(500).json({ message: "eSewa secret key is missing." });
    }

    const amountText = normalizeEsewaAmount(booking.total_price);
    if (!amountText) {
      return res.status(400).json({ message: "Invalid total amount." });
    }

    const transactionUuid = makeTransactionUuid(booking.id);
    const apiBase = String(process.env.API_BASE_URL || "").trim();

    if (!apiBase) {
      return res.status(500).json({ message: "API_BASE_URL is missing." });
    }

    const payload = {
      amount: amountText,
      tax_amount: "0",
      total_amount: amountText,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${apiBase}/api/payments/esewa/success`,
      failure_url: `${apiBase}/api/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: "",
    };

    const toSign = "total_amount=" +
      payload.total_amount +
      ",transaction_uuid=" +
      payload.transaction_uuid +
      ",product_code=" +
      payload.product_code;

    payload.signature = hmacBase64(secretKey, toSign);

    console.log("ESEWA secretKey:", JSON.stringify(secretKey));
    console.log("ESEWA productCode:", JSON.stringify(productCode));
    console.log("ESEWA transactionUuid:", payload.transaction_uuid);
    console.log("ESEWA toSign:", toSign);
    console.log("ESEWA signature:", payload.signature);
    console.log("ESEWA payload:", payload);

    return res.json({
      data: {
        esewaUrl: formUrl,
        formData: payload,
      },
    });
  } catch (err) {
    console.error("initiateEsewaPayment error:", err);
    return res.status(500).json({ message: "Failed to initiate eSewa payment." });
  }
}

export async function esewaSuccess(req, res) {
  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const dataB64 = req.query.data;

    if (!dataB64) {
      return res.redirect(`${clientUrl}/payment/failure/0?reason=missing_data`);
    }

    const decoded = Buffer.from(String(dataB64), "base64").toString("utf8");
    const body = JSON.parse(decoded);

    const { secretKey } = getEsewaConfig();

    const signedNames = body.signed_field_names;
    const signedStr = buildSignedString(body, signedNames);
    const expectedSig = hmacBase64(secretKey, signedStr);

    if (!safeEqual(expectedSig, body.signature)) {
      return res.redirect(
        `${clientUrl}/payment/failure/0?reason=signature_mismatch`
      );
    }

    const bookingId = extractBookingIdFromTxn(body.transaction_uuid);
    if (!bookingId) {
      return res.redirect(`${clientUrl}/payment/failure/0?reason=bad_txn_uuid`);
    }

    let statusOk =
      normalizeStatus(body.status) === "COMPLETE" ||
      normalizeStatus(body.status) === "COMPLETED";

    const verify = await verifyEsewaStatus({
      product_code: body.product_code,
      total_amount: body.total_amount,
      transaction_uuid: body.transaction_uuid,
    });

    if (verify.ok) {
      statusOk = true;
    }

    if (!statusOk) {
      return res.redirect(
        `${clientUrl}/payment/failure/${bookingId}?reason=not_complete`
      );
    }

    const esewaTransactionCode = pickFirstNonEmpty(
      body.transaction_code,
      verify?.raw?.transaction_code
    );

    const esewaRefId = pickFirstNonEmpty(
      body.ref_id,
      body.refId,
      verify?.raw?.ref_id,
      verify?.raw?.refId
    );

    await markBookingPaid(bookingId, {
      esewaRefId,
      esewaTransactionCode,
    });

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

    return res.redirect(`${clientUrl}/payment/success/${bookingId}`);
  } catch (err) {
    console.error("esewaSuccess error:", err);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/payment/failure/0?reason=server_error`);
  }
}

export async function esewaFailure(req, res) {
  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const dataB64 = req.query.data;

    if (!dataB64) {
      return res.redirect(`${clientUrl}/payment/failure/0?reason=cancelled`);
    }

    const decoded = Buffer.from(String(dataB64), "base64").toString("utf8");
    const body = JSON.parse(decoded);

    const bookingId = extractBookingIdFromTxn(body.transaction_uuid) || 0;
    return res.redirect(
      `${clientUrl}/payment/failure/${bookingId}?reason=cancelled`
    );
  } catch (err) {
    console.error("esewaFailure error:", err);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/payment/failure/0?reason=cancelled`);
  }
}