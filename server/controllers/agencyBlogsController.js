// server/controllers/agencyBlogsController.js
import { createAgencyBlog } from "../models/agencyBlogsModel.js";

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