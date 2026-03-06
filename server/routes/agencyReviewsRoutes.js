// server/routes/agencyReviewsRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAgencyReviewsController } from "../controllers/agencyReviewsController.js";

const router = express.Router();

router.get("/", authMiddleware, getAgencyReviewsController);

export default router;