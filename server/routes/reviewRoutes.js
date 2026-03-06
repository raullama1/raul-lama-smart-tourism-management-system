// server/routes/reviewRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  submitReview,
  listReviews,
  updateReviewController,
  deleteReviewController,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", authMiddleware, listReviews);
router.post("/", authMiddleware, submitReview);
router.put("/:reviewId", authMiddleware, updateReviewController);
router.delete("/:reviewId", authMiddleware, deleteReviewController);

export default router;
