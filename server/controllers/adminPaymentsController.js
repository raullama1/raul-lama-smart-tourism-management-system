// server/controllers/adminPaymentsController.js
import {
  getAdminPaymentByIdModel,
  getAdminPaymentsModel,
} from "../models/adminPaymentsModel.js";

export async function getAdminPaymentsController(req, res) {
  try {
    if (!req.user?.id || req.user?.role !== "admin") {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const payments = await getAdminPaymentsModel();

    return res.json({ payments });
  } catch (err) {
    console.error("getAdminPaymentsController error", err);
    return res.status(500).json({ message: "Failed to load payments." });
  }
}

export async function getAdminPaymentByIdController(req, res) {
  try {
    if (!req.user?.id || req.user?.role !== "admin") {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const paymentId = Number(req.params?.paymentId);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: "Valid payment id is required." });
    }

    const payment = await getAdminPaymentByIdModel(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    return res.json({ payment });
  } catch (err) {
    console.error("getAdminPaymentByIdController error", err);
    return res.status(500).json({ message: "Failed to load payment details." });
  }
}