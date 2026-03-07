// server/routes/agencyProfileRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAgencyAvatar } from "../middleware/uploadMiddleware.js";
import {
  changeAgencyPasswordController,
  getAgencyProfileController,
  removeAgencyProfileImageController,
  updateAgencyProfileController,
  uploadAgencyProfileImageController,
} from "../controllers/agencyProfileController.js";

const router = express.Router();

router.get("/me", authMiddleware, getAgencyProfileController);
router.put("/me", authMiddleware, updateAgencyProfileController);
router.put("/me/password", authMiddleware, changeAgencyPasswordController);

router.post(
  "/me/avatar",
  authMiddleware,
  uploadAgencyAvatar.single("avatar"),
  uploadAgencyProfileImageController
);

router.delete(
  "/me/avatar",
  authMiddleware,
  removeAgencyProfileImageController
);

export default router;