// server/routes/adminDashboardRoutes.js
import express from "express";
import { getAdminDashboardController } from "../controllers/adminDashboardController.js";
import { authRequired, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, requireAdmin, getAdminDashboardController);

export default router;