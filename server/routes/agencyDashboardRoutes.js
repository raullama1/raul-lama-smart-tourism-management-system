// server/routes/agencyDashboardRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import { getAgencyDashboardController } from "../controllers/agencyDashboardController.js";

const router = express.Router();

router.get("/", authRequired, getAgencyDashboardController);

export default router;
