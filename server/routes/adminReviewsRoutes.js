// server/routes/adminReviewsRoutes.js
import express from "express";
import {
  getAdminReviewsController,
  deleteAdminReviewController,
} from "../controllers/adminReviewsController.js";
import {
  authRequired,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, requireAdmin, getAdminReviewsController);
router.delete("/:reviewId", authRequired, requireAdmin, deleteAdminReviewController);

export default router;