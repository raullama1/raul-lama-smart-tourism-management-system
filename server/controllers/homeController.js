// server/controllers/homeController.js
import { getPopularTours } from "../models/tourModel.js";
import { getLatestBlogs } from "../models/blogModel.js";

export async function getHomeDataController(req, res) {
  try {
    const [popularTours, latestBlogs] = await Promise.all([
      getPopularTours(6),
      getLatestBlogs(4),
    ]);

    res.json({
      popularTours,
      latestBlogs,
    });
  } catch (err) {
    console.error("getHomeDataController error", err);
    res.status(500).json({ message: "Failed to load home data" });
  }
}
