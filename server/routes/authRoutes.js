// server/routes/authRoutes.js
import express from "express";
import {
  signupController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  sendSignupVerificationCodeController,
} from "../controllers/authController.js";

const router = express.Router();

// Signup: send verification code
router.post("/signup/send-code", sendSignupVerificationCodeController);

// Signup: create account with code
router.post("/signup", signupController);

// Login
router.post("/login", loginController);

// Forgot / reset password
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;
