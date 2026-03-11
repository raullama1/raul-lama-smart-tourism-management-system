// server/routes/adminPaymentsRoutes.js
import express from "express";
import {
  getAdminPaymentByIdController,
  getAdminPaymentsController,
} from "../controllers/adminPaymentsController.js";
import { authRequired, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, requireAdmin, getAdminPaymentsController);
router.get("/:paymentId", authRequired, requireAdmin, getAdminPaymentByIdController);

export default router;