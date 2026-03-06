// server/routes/agencyBlogsRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadBlogImage } from "../middleware/uploadMiddleware.js";
import { createAgencyBlogController } from "../controllers/agencyBlogsController.js";

const router = express.Router();

router.post("/", authMiddleware, uploadBlogImage.single("image"), createAgencyBlogController);

export default router;