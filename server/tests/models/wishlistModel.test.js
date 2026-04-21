// server/tests/models/wishlistModel.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  db: {
    query: vi.fn(),
  },
}));

const { db } = await import("../../db.js");
const {
  addToWishlist,
  removeFromWishlist,
  getWishlistItems,
  getWishlistTourIds,
} = await import("../../models/wishlistModel.js");

describe("wishlistModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToWishlist", () => {
    it("should return true when row is inserted", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await addToWishlist(1, 10);

      expect(db.query).toHaveBeenCalledWith(
        `INSERT IGNORE INTO wishlists (user_id, tour_id) VALUES (?, ?)`,
        [1, 10]
      );
      expect(result).toBe(true);
    });

    it("should return false when duplicate is ignored", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await addToWishlist(1, 10);

      expect(result).toBe(false);
    });
  });

  describe("removeFromWishlist", () => {
    it("should return true when item is removed", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await removeFromWishlist(1, 10);

      expect(db.query).toHaveBeenCalledWith(
        `DELETE FROM wishlists WHERE user_id = ? AND tour_id = ?`,
        [1, 10]
      );
      expect(result).toBe(true);
    });

    it("should return false when nothing is removed", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await removeFromWishlist(1, 10);

      expect(result).toBe(false);
    });
  });

  describe("getWishlistItems", () => {
    it("should return wishlist items", async () => {
      const rows = [
        {
          id: 101,
          title: "Pokhara Tour",
          location: "Pokhara",
          type: "Adventure",
          starting_price: 5000,
          image_url: "pokhara.jpg",
          agency_count: 2,
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await getWishlistItems(1);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe("getWishlistTourIds", () => {
    it("should return numeric tour ids", async () => {
      db.query.mockResolvedValueOnce([
        [{ tour_id: "1" }, { tour_id: "2" }, { tour_id: "3" }],
      ]);

      const result = await getWishlistTourIds(1);

      expect(db.query).toHaveBeenCalledWith(
        `SELECT tour_id FROM wishlists WHERE user_id = ?`,
        [1]
      );
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return empty array when no ids exist", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await getWishlistTourIds(1);

      expect(result).toEqual([]);
    });
  });
});