// server/routes/adminReportsRoutes.js
import express from "express";
import { getAdminReportsController } from "../controllers/adminReportsController.js";
import { authRequired, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, requireAdmin, getAdminReportsController);

export default router;