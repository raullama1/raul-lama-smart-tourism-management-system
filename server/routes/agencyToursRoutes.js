// server/routes/agencyToursRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import { uploadTourImage } from "../middleware/uploadMiddleware.js";
import { createAgencyTourController } from "../controllers/agencyToursController.js";

const router = express.Router();

router.post("/", authRequired, uploadTourImage.single("image"), createAgencyTourController);

export default router;
