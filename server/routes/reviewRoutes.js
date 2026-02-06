// server/routes/reviewRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import { submitReview, listReviews } from "../controllers/reviewController.js";

const router = express.Router();

// Tourist submits review
router.post("/", authRequired, submitReview);

// Public / tourist: view reviews for a tour
router.get("/", listReviews);

export default router;
