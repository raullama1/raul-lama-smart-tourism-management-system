// server/controllers/homeController.js
import {
  getPopularTours,
  getRecommendedToursForUser,
} from "../models/tourModel.js";
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

export async function getHomeRecommendationsController(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const recommendations = await getRecommendedToursForUser(userId, 8);

    res.json({
      data: recommendations,
    });
  } catch (err) {
    console.error("getHomeRecommendationsController error", err);
    res.status(500).json({ message: "Failed to load recommendations." });
  }
}