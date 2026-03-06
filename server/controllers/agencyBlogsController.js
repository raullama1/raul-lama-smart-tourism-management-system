// server/controllers/agencyBlogsController.js
import {
  createAgencyBlog,
  getAgencyBlogs,
  updateAgencyBlog,
  deleteAgencyBlog,
} from "../models/agencyBlogsModel.js";

const ALLOWED_TYPES = [
  "Adventure",
  "Nature",
  "Heritage",
  "Religious",
  "Wildlife",
];

function getAgencyId(req, res) {
  const agencyId = req.user?.id;
  const role = req.user?.role;

  if (!agencyId || role !== "agency") {
    res.status(401).json({ message: "Agency authentication required." });
    return null;
  }

  return agencyId;
}

export async function createAgencyBlogController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const title = String(req.body?.title || "").trim();
    const type = String(req.body?.type || "").trim();
    const content = String(req.body?.content || "").trim();

    if (!title) {
      return res.status(400).json({ message: "Blog title is required." });
    }

    if (!type) {
      return res.status(400).json({ message: "Blog type is required." });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid blog type." });
    }

    if (!content) {
      return res.status(400).json({ message: "Blog content is required." });
    }

    const imageUrl = req.file ? `/uploads/blogs/${req.file.filename}` : "";

    const blog = await createAgencyBlog({
      agencyId,
      title,
      type,
      content,
      imageUrl,
    });

    return res.status(201).json({
      message: "Blog published successfully.",
      blog,
    });
  } catch (err) {
    console.error("createAgencyBlogController error", err);
    return res.status(500).json({ message: "Failed to create blog." });
  }
}

export async function getAgencyBlogsController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const sort =
      String(req.query?.sort || "").trim().toLowerCase() === "oldest"
        ? "oldest"
        : "newest";

    const result = await getAgencyBlogs({
      agencyId,
      search: req.query?.search || "",
      sort,
      page: req.query?.page || 1,
      limit: req.query?.limit || 50,
    });

    return res.json(result);
  } catch (err) {
    console.error("getAgencyBlogsController error", err);
    return res.status(500).json({ message: "Failed to fetch blogs." });
  }
}

export async function updateAgencyBlogController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const blogId = Number(req.params?.blogId);
    const title = String(req.body?.title || "").trim();
    const type = String(req.body?.type || "").trim();
    const content = String(req.body?.content || "").trim();

    if (!blogId) {
      return res.status(400).json({ message: "Invalid blog id." });
    }

    if (!title) {
      return res.status(400).json({ message: "Blog title is required." });
    }

    if (!type) {
      return res.status(400).json({ message: "Blog type is required." });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid blog type." });
    }

    if (!content) {
      return res.status(400).json({ message: "Blog content is required." });
    }

    const imageUrl = req.file ? `/uploads/blogs/${req.file.filename}` : "";

    const blog = await updateAgencyBlog({
      agencyId,
      blogId,
      title,
      type,
      content,
      imageUrl,
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    return res.json({
      message: "Blog updated successfully.",
      blog,
    });
  } catch (err) {
    console.error("updateAgencyBlogController error", err);
    return res.status(500).json({ message: "Failed to update blog." });
  }
}

export async function deleteAgencyBlogController(req, res) {
  try {
    const agencyId = getAgencyId(req, res);
    if (!agencyId) return;

    const blogId = Number(req.params?.blogId);

    if (!blogId) {
      return res.status(400).json({ message: "Invalid blog id." });
    }

    const deleted = await deleteAgencyBlog({ agencyId, blogId });

    if (!deleted) {
      return res.status(404).json({ message: "Blog not found." });
    }

    return res.json({ message: "Blog deleted successfully." });
  } catch (err) {
    console.error("deleteAgencyBlogController error", err);
    return res.status(500).json({ message: "Failed to delete blog." });
  }
}