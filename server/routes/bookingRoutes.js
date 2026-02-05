import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  listMyBookings,
  payBooking,
  cancelMyBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

router.get("/", authRequired, listMyBookings);
router.post("/:bookingId/pay", authRequired, payBooking);
router.post("/:bookingId/cancel", authRequired, cancelMyBooking);

export default router;
