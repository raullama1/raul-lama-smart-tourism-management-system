// server/routes/authRoutes.js
import express from "express";
import {
  signupController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  sendSignupVerificationCodeController,
  meController,
  changePasswordController,
} from "../controllers/authController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// Signup: send verification code
router.post("/signup/send-code", sendSignupVerificationCodeController);

// Signup: create account with code
router.post("/signup", signupController);

// Login
router.post("/login", loginController);

// Get current logged-in user (used for refresh session)
router.get("/me", authRequired, meController);

// Change password (logged in)
router.put("/change-password", authRequired, changePasswordController);

// Forgot / reset password
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;
