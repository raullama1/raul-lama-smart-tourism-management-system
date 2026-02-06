import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getBlogCommentsController,
  addBlogCommentController,
  deleteBlogCommentController,
} from "../controllers/blogCommentsController.js";

const router = express.Router();

router.get("/:blogId/comments", getBlogCommentsController);
router.post("/:blogId/comments", authMiddleware, addBlogCommentController);
router.delete("/:blogId/comments/:commentId", authMiddleware, deleteBlogCommentController);

export default router;
