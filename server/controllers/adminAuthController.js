// server/controllers/adminAuthController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findAdminById,
  findAdminByIdentifier,
  findAnyAdmin,
  updateAdminPasswordById,
} from "../models/adminAuthModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function signToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      role: "admin",
      name: admin.name,
      email: admin.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function validatePasswordRules(password) {
  const rules = [
    { test: /.{8,}/, message: "At least 8 characters" },
    { test: /[A-Z]/, message: "At least one uppercase letter (A-Z)" },
    { test: /[a-z]/, message: "At least one lowercase letter (a-z)" },
    { test: /[0-9]/, message: "At least one number (0-9)" },
    {
      test: /[^A-Za-z0-9]/,
      message: "At least one special character (!@#$, etc.)",
    },
  ];

  return rules.filter((rule) => !rule.test.test(password)).map((rule) => rule.message);
}

export async function adminLoginController(req, res) {
  try {
    const identifier = String(req.body?.identifier || "").trim();
    const password = String(req.body?.password || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/username and password are required.",
      });
    }

    const admin = await findAdminByIdentifier(identifier);

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    const ok = await bcrypt.compare(password, admin.password_hash || "");

    if (!ok) {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }

    const token = signToken(admin);

    return res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        profile_image: admin.profile_image || null,
        created_at: admin.created_at,
      },
    });
  } catch (err) {
    console.error("adminLoginController error", err);
    return res.status(500).json({ message: "Failed to login admin." });
  }
}

export async function adminMeController(req, res) {
  try {
    if (!req.user?.id || req.user?.role !== "admin") {
      return res.status(401).json({ message: "Admin authentication required." });
    }

    const admin = await findAdminById(req.user.id);

    if (!admin) {
      return res.status(401).json({ message: "Admin account not found." });
    }

    return res.json({ admin });
  } catch (err) {
    console.error("adminMeController error", err);
    return res.status(500).json({ message: "Failed to fetch admin profile." });
  }
}

export async function adminResetPasswordController(req, res) {
  try {
    const password = String(req.body?.password || "").trim();
    const confirmPassword = String(req.body?.confirmPassword || "").trim();

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password are required.",
      });
    }

    const ruleErrors = validatePasswordRules(password);

    if (ruleErrors.length > 0) {
      return res.status(400).json({
        message: "Password is too weak. Please fix the following:",
        errors: ruleErrors,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const admin = await findAnyAdmin();

    if (!admin) {
      return res.status(404).json({
        message: "No admin account found.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await updateAdminPasswordById(admin.id, passwordHash);

    return res.json({
      message: "Admin password updated successfully.",
    });
  } catch (err) {
    console.error("adminResetPasswordController error", err);
    return res.status(500).json({ message: "Failed to reset admin password." });
  }
}