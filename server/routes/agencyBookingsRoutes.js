// server/routes/agencyBookingsRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  listAgencyBookingsController,
  getAgencyBookingDetailsController,
  approveAgencyBookingController,
  rejectAgencyBookingController,
} from "../controllers/agencyBookingsController.js";

const router = express.Router();

router.get("/", authRequired, listAgencyBookingsController);
router.get("/:bookingId", authRequired, getAgencyBookingDetailsController);

router.patch("/:bookingId/approve", authRequired, approveAgencyBookingController);
router.patch("/:bookingId/reject", authRequired, rejectAgencyBookingController);

export default router;