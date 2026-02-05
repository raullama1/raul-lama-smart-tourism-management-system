import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  initiateEsewaPayment,
  esewaSuccess,
  esewaFailure,
} from "../controllers/paymentController.js";

const router = express.Router();

// user clicks pay -> we return form fields
router.post("/esewa/initiate", authRequired, initiateEsewaPayment);

// esewa redirects here
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

export default router;
