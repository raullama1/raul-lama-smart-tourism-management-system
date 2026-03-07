// server/routes/agencyEarningsRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAgencyEarningsController } from "../controllers/agencyEarningsController.js";

const router = express.Router();

router.get("/", authMiddleware, getAgencyEarningsController);

export default router;