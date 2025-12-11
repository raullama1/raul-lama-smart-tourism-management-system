// server/routes/publicToursRoutes.js
import express from "express";
import {
  getPublicToursController,
  getPublicTourDetailsController,
} from "../controllers/tourController.js";

const router = express.Router();

// /api/public/tours?search=&location=&...
router.get("/", getPublicToursController);

// /api/public/tours/:tourId
router.get("/:tourId", getPublicTourDetailsController);

export default router;
