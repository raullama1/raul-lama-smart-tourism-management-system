// server/routes/paymentRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  initiateEsewaPayment,
  esewaSuccess,
  esewaFailure,
} from "../controllers/paymentController.js";

const router = express.Router();

// User clicks pay -> return eSewa form fields (new transaction_uuid each time)
router.post("/esewa/initiate", authRequired, initiateEsewaPayment);

// eSewa redirects here after payment attempt
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

export default router;
