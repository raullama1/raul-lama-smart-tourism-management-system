// server/routes/agencyAuthRoutes.js
import express from "express";
import {
  agencyLoginController,
  agencyMeController,
  agencyRegisterController,
  sendAgencyRegisterCodeController,
  agencyCheckAvailabilityController,
} from "../controllers/agencyAuthController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// Send 6-digit email code (valid 60 seconds)
router.post("/register/send-code", sendAgencyRegisterCodeController);

// Register with code
router.post("/register", agencyRegisterController);

// Check field availability (email/phone/pan/name)
router.post("/register/check", agencyCheckAvailabilityController);

// Login
router.post("/login", agencyLoginController);

// Me
router.get("/me", authRequired, agencyMeController);

export default router;
