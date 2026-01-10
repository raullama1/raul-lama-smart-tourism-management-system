import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  listWishlist,
  listWishlistIds,
  addWishlist,
  removeWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", authMiddleware, listWishlist);
router.get("/ids", authMiddleware, listWishlistIds);
router.post("/:tourId", authMiddleware, addWishlist);
router.delete("/:tourId", authMiddleware, removeWishlist);

export default router;
