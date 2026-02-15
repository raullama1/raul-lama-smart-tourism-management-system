// server/controllers/agencySupportController.js
import { createAgencySupportTicket } from "../models/agencySupportModel.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export async function createAgencySupportTicketController(req, res) {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    const email = normalizeEmail(req.body?.email);
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();

    const errors = [];

    if (!fullName) errors.push("Full Name is required.");
    if (!email) errors.push("Email is required.");
    if (email && !isValidEmail(email)) errors.push("Enter a valid email.");
    if (!subject) errors.push("Subject is required.");
    if (!message) errors.push("Message is required.");
    if (message && message.length < 10) errors.push("Message is too short.");

    if (errors.length) {
      return res.status(400).json({
        message: "Please fix the highlighted fields and try again.",
        errors,
      });
    }

    const ticket = await createAgencySupportTicket({
      fullName,
      email,
      subject,
      message,
    });

    return res.status(201).json({
      message: "Your issue has been submitted. Our team will contact you soon.",
      ticket,
    });
  } catch (err) {
    console.error("createAgencySupportTicketController error", err);
    return res.status(500).json({ message: "Failed to submit issue." });
  }
}
