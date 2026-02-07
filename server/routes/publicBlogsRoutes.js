// server/routes/publicBlogsRoutes.js
import express from "express";
import {
  getPublicBlogsController,
  getPublicBlogDetailsController,
} from "../controllers/blogController.js";

const router = express.Router();

// List blogs
router.get("/", getPublicBlogsController);

// Single blog details
router.get("/:blogId", getPublicBlogDetailsController);

export default router;
