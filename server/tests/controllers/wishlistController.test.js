// server/tests/controllers/wishlistController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/wishlistModel.js", () => ({
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
  getWishlistItems: vi.fn(),
  getWishlistTourIds: vi.fn(),
}));

const {
  addToWishlist,
  removeFromWishlist,
  getWishlistItems,
  getWishlistTourIds,
} = await import("../../models/wishlistModel.js");

const {
  listWishlist,
  listWishlistIds,
  addWishlist,
  removeWishlist,
} = await import("../../controllers/wishlistController.js");

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("wishlistController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listWishlist", () => {
    it("should return wishlist items successfully", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();

      const items = [
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

      getWishlistItems.mockResolvedValue(items);

      await listWishlist(req, res);

      expect(getWishlistItems).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ data: items });
    });

    it("should return 500 when loading wishlist fails", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();

      getWishlistItems.mockRejectedValue(new Error("DB error"));

      await listWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to load wishlist.",
      });
    });
  });

  describe("listWishlistIds", () => {
    it("should return wishlist ids successfully", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();

      getWishlistTourIds.mockResolvedValue([1, 2, 3]);

      await listWishlistIds(req, res);

      expect(getWishlistTourIds).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ data: [1, 2, 3] });
    });

    it("should return 500 when loading wishlist ids fails", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();

      getWishlistTourIds.mockRejectedValue(new Error("DB error"));

      await listWishlistIds(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to load wishlist ids.",
      });
    });
  });

  describe("addWishlist", () => {
    it("should return 400 when tourId is missing", async () => {
      const req = { user: { id: 1 }, params: {} };
      const res = mockRes();

      await addWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "tourId is required",
      });
    });

    it("should return 409 when tour is already in wishlist", async () => {
      const req = { user: { id: 1 }, params: { tourId: "10" } };
      const res = mockRes();

      addToWishlist.mockResolvedValue(false);

      await addWishlist(req, res);

      expect(addToWishlist).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "Already in wishlist.",
      });
    });

    it("should add to wishlist successfully", async () => {
      const req = { user: { id: 1 }, params: { tourId: "10" } };
      const res = mockRes();

      addToWishlist.mockResolvedValue(true);

      await addWishlist(req, res);

      expect(addToWishlist).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Added to wishlist.",
      });
    });

    it("should return 500 when adding to wishlist fails", async () => {
      const req = { user: { id: 1 }, params: { tourId: "10" } };
      const res = mockRes();

      addToWishlist.mockRejectedValue(new Error("DB error"));

      await addWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to add to wishlist.",
      });
    });
  });

  describe("removeWishlist", () => {
    it("should return 400 when tourId is missing", async () => {
      const req = { user: { id: 1 }, params: {} };
      const res = mockRes();

      await removeWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "tourId is required",
      });
    });

    it("should remove from wishlist successfully", async () => {
      const req = { user: { id: 1 }, params: { tourId: "10" } };
      const res = mockRes();

      removeFromWishlist.mockResolvedValue(true);

      await removeWishlist(req, res);

      expect(removeFromWishlist).toHaveBeenCalledWith(1, 10);
      expect(res.json).toHaveBeenCalledWith({
        message: "Removed from wishlist.",
      });
    });

    it("should return Not found when item does not exist", async () => {
      const req = { user: { id: 1 }, params: { tourId: "10" } };
      const res = mockRes();

      removeFromWishlist.mockResolvedValue(false);

      await removeWishlist(req, res);

      expect(removeFromWishlist).toHaveBeenCalledWith(1, 10);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not found.",
      });
    });

    it("should return 500 when removing from wishlist fails", async () => {
      const req = { user: { id: 1 }, params: { tourId: "10" } };
      const res = mockRes();

      removeFromWishlist.mockRejectedValue(new Error("DB error"));

      await removeWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to remove from wishlist.",
      });
    });
  });
});