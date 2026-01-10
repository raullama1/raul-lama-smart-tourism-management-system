import {
  addToWishlist,
  removeFromWishlist,
  getWishlistItems,
  getWishlistTourIds,
} from "../models/wishlistModel.js";

export async function listWishlist(req, res) {
  try {
    const userId = req.user.id;
    const items = await getWishlistItems(userId);
    res.json({ data: items });
  } catch (err) {
    console.error("listWishlist error:", err);
    res.status(500).json({ message: "Failed to load wishlist." });
  }
}

export async function listWishlistIds(req, res) {
  try {
    const userId = req.user.id;
    const ids = await getWishlistTourIds(userId);
    res.json({ data: ids }); // keep your current response shape
  } catch (err) {
    console.error("listWishlistIds error:", err);
    res.status(500).json({ message: "Failed to load wishlist ids." });
  }
}

export async function addWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { tourId } = req.params;

    if (!tourId) return res.status(400).json({ message: "tourId is required" });

    const inserted = await addToWishlist(userId, Number(tourId));

    // ✅ if duplicate, INSERT IGNORE returns affectedRows = 0
    if (!inserted) {
      return res.status(409).json({ message: "Already in wishlist." });
    }

    res.status(201).json({ message: "Added to wishlist." });
  } catch (err) {
    console.error("addWishlist error:", err);
    res.status(500).json({ message: "Failed to add to wishlist." });
  }
}

export async function removeWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { tourId } = req.params;

    if (!tourId) return res.status(400).json({ message: "tourId is required" });

    const removed = await removeFromWishlist(userId, Number(tourId));
    res.json({ message: removed ? "Removed from wishlist." : "Not found." });
  } catch (err) {
    console.error("removeWishlist error:", err);
    res.status(500).json({ message: "Failed to remove from wishlist." });
  }
}
