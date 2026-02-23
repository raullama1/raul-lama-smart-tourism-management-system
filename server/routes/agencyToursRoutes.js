// server/routes/agencyToursRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import { uploadTourImage } from "../middleware/uploadMiddleware.js";
import {
  createAgencyTourController,
  listAgencyManageToursController,
  updateAgencyTourStatusController,
  deleteAgencyTourController,
  updateAgencyTourController,
} from "../controllers/agencyToursController.js";

const router = express.Router();

router.post("/", authRequired, uploadTourImage.single("image"), createAgencyTourController);

router.get("/manage", authRequired, listAgencyManageToursController);

router.patch("/manage/:agencyTourId/status", authRequired, updateAgencyTourStatusController);

router.put("/manage/:agencyTourId", authRequired, uploadTourImage.single("image"), updateAgencyTourController);

router.delete("/manage/:agencyTourId", authRequired, deleteAgencyTourController);

export default router;