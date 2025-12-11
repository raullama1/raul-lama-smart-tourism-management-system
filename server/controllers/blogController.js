// server/controllers/blogController.js
import {
  getPublicBlogs,
  getPublicBlogById,
  getLatestBlogs,
} from "../models/blogModel.js";

export async function getPublicBlogsController(req, res) {
  try {
    const blogs = await getPublicBlogs(req.query);
    res.json(blogs);
  } catch (err) {
    console.error("getPublicBlogsController error", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
}

// Blog details + recent blogs
export async function getPublicBlogDetailsController(req, res) {
  try {
    const { blogId } = req.params;

    const blog = await getPublicBlogById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // 3 recent blogs, excluding current
    const recentBlogs = await getLatestBlogs(3, blog.id);

    res.json({ blog, recentBlogs });
  } catch (err) {
    console.error("getPublicBlogDetailsController error", err);
    res.status(500).json({ message: "Failed to fetch blog details" });
  }
}
