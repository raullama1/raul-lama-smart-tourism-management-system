// server/routes/paymentRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  initiateEsewaPayment,
  esewaSuccess,
  esewaFailure,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/esewa/initiate", authRequired, initiateEsewaPayment);
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

export default router;