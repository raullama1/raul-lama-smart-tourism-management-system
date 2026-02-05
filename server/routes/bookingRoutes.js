import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  listMyBookings,
  payBooking,
  cancelMyBooking,
  getBookingPreview,
  createBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

router.get("/", authRequired, listMyBookings);
router.post("/:bookingId/pay", authRequired, payBooking);
router.post("/:bookingId/cancel", authRequired, cancelMyBooking);
router.get("/preview/:agencyTourId", authRequired, getBookingPreview);
router.post("/", authRequired, createBooking);

export default router;
