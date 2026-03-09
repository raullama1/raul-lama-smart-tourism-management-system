// server/routes/adminAuthRoutes.js
import express from "express";
import {
  adminLoginController,
  adminMeController,
  adminResetPasswordController,
} from "../controllers/adminAuthController.js";
import { authRequired, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", adminLoginController);
router.post("/reset-password", adminResetPasswordController);
router.get("/me", authRequired, requireAdmin, adminMeController);

export default router;