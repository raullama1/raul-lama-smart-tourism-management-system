// server/routes/publicRoutes.js
import express from "express";
import { getHomePublicData } from "../controllers/homeController.js";
import {
  getPublicToursController,
  getPublicTourDetailsController,
} from "../controllers/tourController.js";

const router = express.Router();

// Home (Screen 1)
router.get("/home", getHomePublicData);

// Tours list (Screen 2)
router.get("/tours", getPublicToursController);

// Tour details (Screen 3)
router.get("/tours/:id", getPublicTourDetailsController);

export default router;
