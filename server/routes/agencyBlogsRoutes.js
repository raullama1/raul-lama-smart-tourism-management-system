// server/routes/agencyBlogsRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadBlogImage } from "../middleware/uploadMiddleware.js";
import {
  createAgencyBlogController,
  getAgencyBlogsController,
  updateAgencyBlogController,
  deleteAgencyBlogController,
} from "../controllers/agencyBlogsController.js";

const router = express.Router();

router.get("/", authMiddleware, getAgencyBlogsController);

router.post(
  "/",
  authMiddleware,
  uploadBlogImage.single("image"),
  createAgencyBlogController
);

router.put(
  "/:blogId",
  authMiddleware,
  uploadBlogImage.single("image"),
  updateAgencyBlogController
);

router.delete("/:blogId", authMiddleware, deleteAgencyBlogController);

export default router;