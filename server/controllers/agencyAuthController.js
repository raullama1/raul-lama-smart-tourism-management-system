// server/controllers/agencyAuthController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  findAgencyByEmail,
  findAgencyById,
  createAgency,
  findAgencyByPhone,
  findAgencyByPanVat,
  findAgencyByName,
  checkAgencyUniqueness,
} from "../models/agencyModel.js";

import {
  createAgencyEmailVerification,
  findValidAgencyEmailVerification,
  markAgencyEmailVerificationUsed,
} from "../models/agencyEmailVerificationModel.js";

import { sendSignupVerificationEmail } from "../utils/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = "7d";

function signAgencyToken(agency) {
  return jwt.sign({ id: agency.id, role: "agency" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password || "")) errors.push("At least one uppercase letter (A-Z)");
  if (!/[a-z]/.test(password || "")) errors.push("At least one lowercase letter (a-z)");
  if (!/[0-9]/.test(password || "")) errors.push("At least one number (0-9)");
  if (!/[^A-Za-z0-9]/.test(password || "")) {
    errors.push("At least one special character (!@#$, etc.)");
  }

  return errors;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhoneNp(phoneDigits) {
  const digits = String(phoneDigits || "").replace(/\D/g, "");
  if (digits.length !== 10) return null;
  return `+977${digits}`;
}

function normalizePanVat(panVat) {
  const digits = String(panVat || "").replace(/\D/g, "");
  if (digits.length !== 9) return null;
  return digits;
}

function pushUnique(list, msg) {
  if (!list.includes(msg)) list.push(msg);
}

async function buildDuplicateErrors({ name, email, phone, pan_vat }) {
  const dup = [];

  const byEmail = await findAgencyByEmail(email);
  if (byEmail) pushUnique(dup, "An agency with this email already exists.");

  const byPhone = await findAgencyByPhone(phone);
  if (byPhone) pushUnique(dup, "An agency with this contact number already exists.");

  const byPanVat = await findAgencyByPanVat(pan_vat);
  if (byPanVat) pushUnique(dup, "An agency with this PAN/VAT already exists.");

  const byName = await findAgencyByName(name);
  if (byName) pushUnique(dup, "An agency with this name already exists.");

  return dup;
}

/* ------------------------------------------------------------------ */
/* CHECK AVAILABILITY (NAME/EMAIL/PHONE/PAN-VAT)                       */
/* ------------------------------------------------------------------ */
export async function agencyCheckAvailabilityController(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const phoneNormalized = normalizePhoneNp(req.body?.phone);
    const panVatNormalized = req.body?.pan_vat ? normalizePanVat(req.body?.pan_vat) : null;

    const taken = await checkAgencyUniqueness({
      name: name || null,
      email: email || null,
      phone: phoneNormalized || null,
      pan_vat: panVatNormalized || null,
    });

    return res.json({ taken });
  } catch (err) {
    console.error("agencyCheckAvailabilityController error", err);
    return res.status(500).json({ message: "Failed to check availability." });
  }
}

/* ------------------------------------------------------------------ */
/* SEND REGISTER VERIFICATION CODE                                    */
/* ------------------------------------------------------------------ */
export async function sendAgencyRegisterCodeController(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required to send verification code." });
    }

    const existing = await findAgencyByEmail(email);
    if (existing) {
      return res.status(400).json({
        message: "Duplicate details found. Please use unique information.",
        errors: ["An agency with this email already exists."],
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await createAgencyEmailVerification(email, code, expiresAt);

    try {
      await sendSignupVerificationEmail(email, code);
    } catch (mailErr) {
      console.error("sendSignupVerificationEmail error", mailErr);
    }

    return res.json({
      message:
        "Verification code sent. Please check your email. Code is valid for 60 seconds.",
    });
  } catch (err) {
    console.error("sendAgencyRegisterCodeController error", err);
    return res.status(500).json({ message: "Failed to send verification code." });
  }
}

/* ------------------------------------------------------------------ */
/* REGISTER AGENCY                                                    */
/* ------------------------------------------------------------------ */
export async function agencyRegisterController(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const address = String(req.body?.address || "").trim();
    const verificationCode = String(req.body?.verificationCode || "").trim();
    const password = String(req.body?.password || "");

    const phoneNormalized = normalizePhoneNp(req.body?.phone);

    const panVatRaw = String(req.body?.pan_vat || "").trim();
    const panVatNormalized = normalizePanVat(panVatRaw);

    if (
      !name ||
      !email ||
      !phoneNormalized ||
      !address ||
      !panVatRaw ||
      !password ||
      !verificationCode
    ) {
      return res.status(400).json({ message: "All required fields are required." });
    }

    if (address.length < 5) {
      return res.status(400).json({ message: "Address is too short." });
    }

    if (!phoneNormalized) {
      return res.status(400).json({ message: "Phone number must be 10 digits (Nepal)." });
    }

    if (!panVatNormalized) {
      return res.status(400).json({ message: "PAN/VAT must be exactly 9 digits." });
    }

    const pwdErrors = validatePasswordStrength(password);
    if (pwdErrors.length > 0) {
      return res.status(400).json({
        message: "Password is too weak. Please follow the rules.",
        errors: pwdErrors,
      });
    }

    const verification = await findValidAgencyEmailVerification(email, verificationCode);
    if (!verification) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const duplicateErrors = await buildDuplicateErrors({
      name,
      email,
      phone: phoneNormalized,
      pan_vat: panVatNormalized,
    });

    if (duplicateErrors.length > 0) {
      return res.status(400).json({
        message: "Duplicate details found. Please use unique information.",
        errors: duplicateErrors,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const agency = await createAgency({
      name,
      email,
      phone: phoneNormalized,
      address,
      pan_vat: panVatNormalized,
      passwordHash,
    });

    await markAgencyEmailVerificationUsed(verification.id);

    const safeAgency = {
      id: agency.id,
      name: agency.name,
      email: agency.email,
      phone: agency.phone,
      address: agency.address,
      pan_vat: agency.pan_vat,
      role: "agency",
    };

    const token = signAgencyToken(safeAgency);

    return res.status(201).json({ token, agency: safeAgency });
  } catch (err) {
    console.error("agencyRegisterController error", err);

    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Duplicate details found. Please use unique information.",
        errors: ["One or more fields already exist (email / phone / PAN/VAT)."],
      });
    }

    return res.status(500).json({ message: "Failed to register agency." });
  }
}

/* ------------------------------------------------------------------ */
/* LOGIN                                                              */
/* ------------------------------------------------------------------ */
export async function agencyLoginController(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const agency = await findAgencyByEmail(email);
    if (!agency) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!agency.password_hash) {
      return res.status(400).json({
        message: "Agency password not set. Please register or contact admin.",
      });
    }

    const ok = await bcrypt.compare(password, agency.password_hash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const safeAgency = {
      id: agency.id,
      name: agency.name,
      email: agency.email,
      phone: agency.phone,
      address: agency.address,
      pan_vat: agency.pan_vat,
      role: "agency",
    };

    const token = signAgencyToken(safeAgency);

    return res.json({ token, agency: safeAgency });
  } catch (err) {
    console.error("agencyLoginController error", err);
    return res.status(500).json({ message: "Failed to login agency." });
  }
}

/* ------------------------------------------------------------------ */
/* ME                                                                 */
/* ------------------------------------------------------------------ */
export async function agencyMeController(req, res) {
  try {
    const agencyId = req.user?.id;
    const role = req.user?.role;

    if (!agencyId || role !== "agency") {
      return res.status(401).json({ message: "Authentication required." });
    }

    const agency = await findAgencyById(agencyId);
    if (!agency) {
      return res.status(401).json({ message: "Agency not found." });
    }

    return res.json({
      agency: { ...agency, role: "agency" },
    });
  } catch (err) {
    console.error("agencyMeController error", err);
    return res.status(500).json({ message: "Failed to load agency." });
  }
}
