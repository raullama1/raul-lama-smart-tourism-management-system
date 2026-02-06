import { getPublicBlogById } from "../models/blogModel.js";
import {
  getBlogCommentsPaged,
  addBlogComment,
  deleteBlogCommentOwn,
} from "../models/blogCommentsModel.js";

export async function getBlogCommentsController(req, res) {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 6 } = req.query;

    const blog = await getPublicBlogById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const result = await getBlogCommentsPaged(blogId, { page, limit });
    res.json({ comments: result.data, pagination: result.pagination });
  } catch (err) {
    console.error("getBlogCommentsController error", err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
}

export async function addBlogCommentController(req, res) {
  try {
    const { blogId } = req.params;

    const blog = await getPublicBlogById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required." });

    const comment = (req.body?.comment || "").trim();
    if (!comment) return res.status(400).json({ message: "Comment is required." });
    if (comment.length > 500) return res.status(400).json({ message: "Comment too long (max 500)." });

    const created = await addBlogComment({ blogId, userId, comment });
    res.status(201).json({ comment: created });
  } catch (err) {
    console.error("addBlogCommentController error", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
}

export async function deleteBlogCommentController(req, res) {
  try {
    const { blogId, commentId } = req.params;

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required." });

    const affected = await deleteBlogCommentOwn({
      blogId,
      commentId,
      userId,
    });

    if (!affected) {
      return res.status(403).json({ message: "Not allowed or comment not found." });
    }

    res.json({ message: "Comment deleted." });
  } catch (err) {
    console.error("deleteBlogCommentController error", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
}
