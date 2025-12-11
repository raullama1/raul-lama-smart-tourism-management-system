// server/routes/publicBlogsRoutes.js
import express from "express";
import {
  getPublicBlogsController,
  getPublicBlogDetailsController,
} from "../controllers/blogController.js";

const router = express.Router();

// List blogs (Screen 4)
router.get("/", getPublicBlogsController);

// Single blog details (Screen 5)
router.get("/:blogId", getPublicBlogDetailsController);

export default router;
