// server/routes/profileRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";
import {
  getMyProfileController,
  updateMyProfileController,
  uploadProfileImageController,
  removeProfileImageController,
} from "../controllers/profileController.js";

const router = express.Router();

// profile
router.get("/me", authMiddleware, getMyProfileController);
router.put("/me", authMiddleware, updateMyProfileController);

// avatar
router.post(
  "/me/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"),
  uploadProfileImageController
);

router.delete("/me/avatar", authMiddleware, removeProfileImageController);

export default router;
