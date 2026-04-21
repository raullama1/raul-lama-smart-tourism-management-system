// server/tests/controllers/tourController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/tourModel.js", () => ({
  getPublicTours: vi.fn(),
  getPopularTours: vi.fn(),
  getPublicTourDetails: vi.fn(),
  getPublicTourSuggestions: vi.fn(),
}));

const {
  getPublicTours,
  getPopularTours,
  getPublicTourDetails,
  getPublicTourSuggestions,
} = await import("../../models/tourModel.js");

const {
  getPublicToursController,
  getPublicTourSuggestionsController,
  getPublicHomeController,
  getPublicTourDetailsController,
} = await import("../../controllers/tourController.js");

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("tourController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicToursController", () => {
    it("should return tours successfully", async () => {
      const req = { query: { search: "pokhara" } };
      const res = mockRes();

      const tours = {
        data: [{ id: 1, title: "Pokhara Tour" }],
        pagination: { total: 1, page: 1, limit: 6, hasMore: false },
      };

      getPublicTours.mockResolvedValue(tours);

      await getPublicToursController(req, res);

      expect(getPublicTours).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(tours);
    });

    it("should return 500 when model throws error", async () => {
      const req = { query: {} };
      const res = mockRes();

      getPublicTours.mockRejectedValue(new Error("DB error"));

      await getPublicToursController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch tours",
      });
    });
  });

  describe("getPublicTourSuggestionsController", () => {
    it("should return suggestions successfully", async () => {
      const req = { query: { q: "ever" } };
      const res = mockRes();

      const suggestions = [
        { id: 1, title: "Everest Base Camp", location: "Solukhumbu" },
      ];

      getPublicTourSuggestions.mockResolvedValue(suggestions);

      await getPublicTourSuggestionsController(req, res);

      expect(getPublicTourSuggestions).toHaveBeenCalledWith("ever");
      expect(res.json).toHaveBeenCalledWith({
        data: suggestions,
      });
    });

    it("should trim search query before passing to model", async () => {
      const req = { query: { q: "   chitwan   " } };
      const res = mockRes();

      getPublicTourSuggestions.mockResolvedValue([]);

      await getPublicTourSuggestionsController(req, res);

      expect(getPublicTourSuggestions).toHaveBeenCalledWith("chitwan");
      expect(res.json).toHaveBeenCalledWith({ data: [] });
    });

    it("should return 500 when model throws error", async () => {
      const req = { query: { q: "abc" } };
      const res = mockRes();

      getPublicTourSuggestions.mockRejectedValue(new Error("DB error"));

      await getPublicTourSuggestionsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch tour suggestions",
      });
    });
  });

  describe("getPublicHomeController", () => {
    it("should return home data successfully", async () => {
      const req = {};
      const res = mockRes();

      const popularTours = [{ id: 1, title: "Annapurna Trek" }];
      getPopularTours.mockResolvedValue(popularTours);

      await getPublicHomeController(req, res);

      expect(getPopularTours).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({
        popularTours,
        latestBlogs: [],
      });
    });

    it("should return 500 when model throws error", async () => {
      const req = {};
      const res = mockRes();

      getPopularTours.mockRejectedValue(new Error("DB error"));

      await getPublicHomeController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch home data",
      });
    });
  });

  describe("getPublicTourDetailsController", () => {
    it("should return single tour details successfully", async () => {
      const req = { params: { tourId: "1" } };
      const res = mockRes();

      const result = {
        tour: { id: 1, title: "Mustang Tour" },
        agencies: [{ agency_id: 2, agency_name: "Astra Travels" }],
      };

      getPublicTourDetails.mockResolvedValue(result);

      await getPublicTourDetailsController(req, res);

      expect(getPublicTourDetails).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it("should return 404 when tour is not found", async () => {
      const req = { params: { tourId: "999" } };
      const res = mockRes();

      getPublicTourDetails.mockResolvedValue(null);

      await getPublicTourDetailsController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Tour not found",
      });
    });

    it("should return 500 when model throws error", async () => {
      const req = { params: { tourId: "1" } };
      const res = mockRes();

      getPublicTourDetails.mockRejectedValue(new Error("DB error"));

      await getPublicTourDetailsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to fetch tour details",
      });
    });
  });
});