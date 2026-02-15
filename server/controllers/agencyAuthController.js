import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findAgencyByEmail, findAgencyById } from "../models/agencyModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = "7d";

function signAgencyToken(agency) {
  return jwt.sign({ id: agency.id, role: "agency" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function agencyLoginController(req, res) {
  try {
    const { email, password } = req.body || {};

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
      role: "agency",
    };

    const token = signAgencyToken(safeAgency);

    return res.json({ token, agency: safeAgency });
  } catch (err) {
    console.error("agencyLoginController error", err);
    return res.status(500).json({ message: "Failed to login agency." });
  }
}

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
