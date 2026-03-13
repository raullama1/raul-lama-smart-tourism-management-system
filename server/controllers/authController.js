// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../db.js";

import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPasswordHash,
} from "../models/userModel.js";

import { findAgencyByEmail } from "../models/agencyModel.js";

import {
  createEmailVerification,
  findValidEmailVerification,
  markVerificationUsed,
} from "../models/emailVerificationModel.js";
import {
  sendPasswordResetEmail,
  sendSignupVerificationEmail,
} from "../utils/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = "7d";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const RESET_PASSWORD_TOKEN_EXP_MINUTES = 5;

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password || "")) {
    errors.push("At least one uppercase letter (A-Z)");
  }
  if (!/[a-z]/.test(password || "")) {
    errors.push("At least one lowercase letter (a-z)");
  }
  if (!/[0-9]/.test(password || "")) {
    errors.push("At least one number (0-9)");
  }
  if (!/[^A-Za-z0-9]/.test(password || "")) {
    errors.push("At least one special character (!@#$, etc.)");
  }

  return errors;
}

export async function sendSignupVerificationCodeController(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required to send verification code." });
    }

    const agencyExisting = await findAgencyByEmail(email);
    if (agencyExisting) {
      return res.status(400).json({
        message:
          "This email is already registered as an agency. Please use a different email for user.",
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await createEmailVerification(email, code, expiresAt);

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
    console.error("sendSignupVerificationCodeController error", err);
    return res
      .status(500)
      .json({ message: "Failed to send verification code." });
  }
}

export async function signupController(req, res) {
  try {
    const { name, email, password, verificationCode } = req.body || {};

    if (!name || !email || !password || !verificationCode) {
      return res.status(400).json({
        message: "Name, email, password, and verification code are required.",
      });
    }

    const agencyExisting = await findAgencyByEmail(email);
    if (agencyExisting) {
      return res.status(400).json({
        message:
          "This email is already registered as an agency. Please use a different email for user.",
      });
    }

    const pwdErrors = validatePasswordStrength(password);
    if (pwdErrors.length > 0) {
      return res.status(400).json({
        message: "Password is too weak. Please follow the rules.",
        errors: pwdErrors,
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    const verification = await findValidEmailVerification(
      email,
      verificationCode,
    );
    if (!verification) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      name,
      email,
      passwordHash,
      role: "tourist",
    });

    await markVerificationUsed(verification.id);

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        ...user,
        is_blocked: false,
      },
    });
  } catch (err) {
    console.error("signupController error", err);

    if (err?.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    return res.status(500).json({ message: "Failed to signup user." });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (user.role !== "tourist") {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    if (Number(user.is_blocked || 0) === 1) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_blocked: Number(user.is_blocked || 0) === 1,
    };

    const token = signToken(safeUser);

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("loginController error", err);
    return res.status(500).json({ message: "Failed to login user." });
  }
}

export async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await findUserByEmail(email);

    if (
      !user ||
      user.role !== "tourist" ||
      Number(user.is_blocked || 0) === 1
    ) {
      return res.json({
        message:
          "Password reset link sent successfully. It is valid for 5 minutes. Please check your inbox.",
      });
    }

    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + RESET_PASSWORD_TOKEN_EXP_MINUTES * 60 * 1000,
    );

    await db.query(
      `INSERT INTO password_reset_tokens (user_id, account_type, token_hash, expires_at)
       VALUES (?, 'user', ?, ?)`,
      [user.id, tokenHash, expiresAt],
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${plainToken}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (err) {
      console.error("Error sending reset email", err);
    }

    return res.json({
      message:
        "If an account with that email exists, a reset link (valid for 5 minutes and one-time use) has been sent.",
    });
  } catch (err) {
    console.error("forgotPasswordController error", err);
    return res.status(500).json({ message: "Failed to process request." });
  }
}

export async function resetPasswordController(req, res) {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }

    const pwdErrors = validatePasswordStrength(password);
    if (pwdErrors.length > 0) {
      return res.status(400).json({
        message: "Password is too weak. Please follow the rules.",
        errors: pwdErrors,
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [rows] = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND account_type = 'user'
       LIMIT 1`,
      [tokenHash],
    );

    const record = rows[0];

    if (!record) {
      return res.status(400).json({
        message:
          "This password reset link is invalid or has already been used.",
      });
    }

    if (record.used_at) {
      return res.status(400).json({
        message: "This password reset link has already been used.",
      });
    }

    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    if (expiresAt < now) {
      return res
        .status(400)
        .json({ message: "This password reset link has expired." });
    }

    const user = await findUserById(record.user_id);
    if (
      !user ||
      user.role !== "tourist" ||
      Number(user.is_blocked || 0) === 1
    ) {
      return res.status(400).json({
        message:
          "This password reset link is invalid or has already been used.",
      });
    }

    const newHash = await bcrypt.hash(password, 10);
    await updateUserPasswordHash(record.user_id, newHash);

    await db.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = ?`,
      [record.id],
    );

    return res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("resetPasswordController error", err);
    return res.status(500).json({ message: "Failed to reset password." });
  }
}

export async function changePasswordController(req, res) {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (req.user?.role !== "tourist") {
      return res.status(403).json({
        message: "This account is not allowed to use tourist password change.",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password.",
      });
    }

    const pwdErrors = validatePasswordStrength(newPassword);
    if (pwdErrors.length > 0) {
      return res.status(400).json({
        message: "Password is too weak. Please follow the rules.",
        errors: pwdErrors,
      });
    }

    const user = await findUserById(userId);
    if (
      !user ||
      user.role !== "tourist" ||
      Number(user.is_blocked || 0) === 1
    ) {
      return res.status(404).json({ message: "User not found." });
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordHash(userId, newHash);

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("changePasswordController error", err);
    return res.status(500).json({ message: "Failed to change password." });
  }
}

export async function meController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const [rows] = await db.query(
      "SELECT id, name, email, role, COALESCE(is_blocked, 0) AS is_blocked FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    const user = rows[0];
    if (!user || user.role !== "tourist") {
      return res.status(401).json({ message: "User not found." });
    }

    if (Number(user.is_blocked || 0) === 1) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
      });
    }

    return res.json({
      user: {
        ...user,
        is_blocked: Number(user.is_blocked || 0) === 1,
      },
    });
  } catch (err) {
    console.error("meController error", err);
    return res.status(500).json({ message: "Failed to load user." });
  }
}