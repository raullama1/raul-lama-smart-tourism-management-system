// server/routes/adminTouristsRoutes.js
import express from "express";
import {
  getAdminTouristByIdController,
  getAdminTouristsController,
  updateAdminTouristStatusController,
} from "../controllers/adminTouristsController.js";
import { authRequired, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, requireAdmin, getAdminTouristsController);
router.get("/:userId", authRequired, requireAdmin, getAdminTouristByIdController);
router.patch(
  "/:userId/status",
  authRequired,
  requireAdmin,
  updateAdminTouristStatusController
);

export default router;