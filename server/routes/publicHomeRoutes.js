// server/routes/publicHomeRoutes.js
import express from "express";
import { getHomeDataController } from "../controllers/homeController.js";

const router = express.Router();

// GET /api/public/home
router.get("/", getHomeDataController);

export default router;
