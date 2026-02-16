// server/routes/agencyAuthRoutes.js
import express from "express";
import {
  agencyLoginController,
  agencyMeController,
  agencyRegisterController,
  sendAgencyRegisterCodeController,
  agencyCheckAvailabilityController,
  agencyForgotPasswordController,
  agencyResetPasswordController,
} from "../controllers/agencyAuthController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// Send 6-digit email code
router.post("/register/send-code", sendAgencyRegisterCodeController);

// Register with verification code
router.post("/register", agencyRegisterController);

// Check availability (name/email/phone/pan)
router.post("/register/check", agencyCheckAvailabilityController);

// Login
router.post("/login", agencyLoginController);

// Current agency session
router.get("/me", authRequired, agencyMeController);

// Forgot password
router.post("/forgot-password", agencyForgotPasswordController);

// Reset password
router.post("/reset-password", agencyResetPasswordController);

export default router;
