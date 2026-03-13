// server/routes/publicHomeRoutes.js
import express from "express";
import {
  getHomeDataController,
  getHomeRecommendationsController,
} from "../controllers/homeController.js";
import { authRequired, requireTourist } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/public/home
router.get("/", getHomeDataController);

// GET /api/public/home/recommendations
router.get("/recommendations", authRequired, requireTourist, getHomeRecommendationsController);

export default router;