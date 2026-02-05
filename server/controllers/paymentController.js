import crypto from "crypto";
import axios from "axios";
import { getBookingForPayment, markBookingPaid } from "../models/paymentModel.js";

function hmacBase64(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

function buildSignedString(obj, signedFieldNames) {
  return signedFieldNames
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => `${k}=${obj[k]}`)
    .join(",");
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

    if (booking.booking_status !== "Approved" || booking.payment_status !== "Unpaid") {
      return res.status(400).json({ message: "Payment not allowed for this booking." });
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
    const secretKey = process.env.ESEWA_SECRET_KEY || "";
    const formUrl =
      process.env.ESEWA_FORM_URL ||
      "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

    const total = Number(booking.total_price || 0);
    if (!total || total < 1) {
      return res.status(400).json({ message: "Invalid total amount." });
    }

    const transactionUuid = `BK-${booking.id}-${booking.ref_code}`;

    const payload = {
      amount: String(total),
      tax_amount: "0",
      total_amount: String(total),
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${
        process.env.API_BASE_URL || "http://localhost:5001"
      }/api/payments/esewa/success?bookingId=${booking.id}`,
      failure_url: `${
        process.env.API_BASE_URL || "http://localhost:5001"
      }/api/payments/esewa/failure?bookingId=${booking.id}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: "",
    };

    const toSign = buildSignedString(payload, payload.signed_field_names);
    payload.signature = hmacBase64(secretKey, toSign);

    return res.json({
      data: {
        esewaUrl: formUrl,
        formData: payload,
      },
    });
  } catch (err) {
    console.error("initiateEsewaPayment error:", err);
    res.status(500).json({ message: "Failed to initiate eSewa payment." });
  }
}

export async function esewaSuccess(req, res) {
  try {
    const { bookingId } = req.query;
    const dataB64 = req.query.data;

    if (!bookingId || !dataB64) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failure/${bookingId || "0"}`
      );
    }

    const decoded = Buffer.from(String(dataB64), "base64").toString("utf8");
    const body = JSON.parse(decoded);

    const secretKey = process.env.ESEWA_SECRET_KEY || "";
    const signedNames = body.signed_field_names;
    const signedStr = buildSignedString(body, signedNames);
    const expectedSig = hmacBase64(secretKey, signedStr);

    if (expectedSig !== body.signature) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failure/${bookingId}`
      );
    }

    const statusUrl =
      process.env.ESEWA_STATUS_URL ||
      "https://uat.esewa.com.np/api/epay/transaction/status/";

    const productCode = body.product_code;
    const totalAmount = body.total_amount;
    const transactionUuid = body.transaction_uuid;

    let statusOk = body.status === "COMPLETE";

    try {
      const verifyRes = await axios.get(statusUrl, {
        params: {
          product_code: productCode,
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
        },
        timeout: 8000,
      });

      statusOk = verifyRes?.data?.status === "COMPLETE";
    } catch (e) {
      statusOk = false;
    }

    if (!statusOk) {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/failure/${bookingId}`
      );
    }

    await markBookingPaid(Number(bookingId));
    return res.redirect(`${process.env.CLIENT_URL}/payment/success/${bookingId}`);
  } catch (err) {
    console.error("esewaSuccess error:", err);
    return res.redirect(`${process.env.CLIENT_URL}/payment/failure/0`);
  }
}

export async function esewaFailure(req, res) {
  const { bookingId } = req.query;
  return res.redirect(
    `${process.env.CLIENT_URL}/payment/failure/${bookingId || "0"}`
  );
}
