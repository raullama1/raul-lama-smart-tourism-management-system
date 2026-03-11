// server/routes/adminAgenciesRoutes.js
import express from "express";
import {
  getAdminAgenciesController,
  getAdminAgencyByIdController,
  updateAdminAgencyStatusController,
} from "../controllers/adminAgenciesController.js";
import { authRequired, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authRequired, requireAdmin, getAdminAgenciesController);
router.get("/:agencyId", authRequired, requireAdmin, getAdminAgencyByIdController);
router.patch(
  "/:agencyId/status",
  authRequired,
  requireAdmin,
  updateAdminAgencyStatusController
);

export default router;