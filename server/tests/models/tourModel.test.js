// server/tests/models/tourModel.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  db: {
    query: vi.fn(),
  },
}));

const { db } = await import("../../db.js");
const {
  getPublicTours,
  getPublicTourSuggestions,
  getPopularTours,
  getPublicTourDetails,
} = await import("../../models/tourModel.js");

describe("tourModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicTours", () => {
    it("should return tours with pagination", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              title: "Pokhara Tour",
              location: "Pokhara",
              type: "Adventure",
              starting_price: 5000,
            },
          ],
        ])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await getPublicTours({
        search: "Pokhara",
        page: 1,
        limit: 6,
      });

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        data: [
          {
            id: 1,
            title: "Pokhara Tour",
            location: "Pokhara",
            type: "Adventure",
            starting_price: 5000,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 6,
          hasMore: false,
        },
      });
    });

    it("should calculate hasMore correctly", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            { id: 1, title: "Tour 1" },
            { id: 2, title: "Tour 2" },
          ],
        ])
        .mockResolvedValueOnce([[{ total: 10 }]]);

      const result = await getPublicTours({
        page: 1,
        limit: 2,
      });

      expect(result.pagination.hasMore).toBe(true);
    });
  });

  describe("getPublicTourSuggestions", () => {
    it("should return empty array when query is blank", async () => {
      const result = await getPublicTourSuggestions("   ");

      expect(result).toEqual([]);
      expect(db.query).not.toHaveBeenCalled();
    });

    it("should return matching suggestions", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            title: "Everest Base Camp",
            location: "Solukhumbu",
          },
        ],
      ]);

      const result = await getPublicTourSuggestions("Ever");

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          id: 1,
          title: "Everest Base Camp",
          location: "Solukhumbu",
        },
      ]);
    });
  });

  describe("getPopularTours", () => {
    it("should return popular tours", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            title: "Annapurna Trek",
            starting_price: 12000,
          },
        ],
      ]);

      const result = await getPopularTours(6);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          id: 1,
          title: "Annapurna Trek",
          starting_price: 12000,
        },
      ]);
    });
  });

  describe("getPublicTourDetails", () => {
    it("should return null when tour is not found", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await getPublicTourDetails(999);

      expect(result).toBeNull();
    });

    it("should return null when no active agencies exist", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              title: "Mustang Tour",
              short_description: "Short",
              long_description: "Long description",
              location: "Mustang",
              latitude: 28.0,
              longitude: 83.0,
              type: "Adventure",
              image_url: "tour.jpg",
            },
          ],
        ])
        .mockResolvedValueOnce([[]]);

      const result = await getPublicTourDetails(1);

      expect(result).toBeNull();
    });

    it("should return tour details with agencies", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              title: "Mustang Tour",
              short_description: "Short",
              long_description: "Long description",
              location: "Mustang",
              latitude: 28.0,
              longitude: 83.0,
              type: "Adventure",
              image_url: "tour.jpg",
            },
          ],
        ])
        .mockResolvedValueOnce([
          [
            {
              agency_tour_id: 11,
              agency_id: 2,
              agency_name: "Astra Travels",
              price: 15000,
              available_dates: "2026-05-01|2026-05-05",
              start_date: "2026-05-01",
              end_date: "2026-05-05",
            },
          ],
        ]);

      const result = await getPublicTourDetails(1);

      expect(result).toEqual({
        tour: {
          id: 1,
          title: "Mustang Tour",
          short_description: "Short",
          long_description: "Long description",
          location: "Mustang",
          latitude: 28.0,
          longitude: 83.0,
          type: "Adventure",
          image_url: "tour.jpg",
          description: "Long description",
        },
        agencies: [
          {
            agency_tour_id: 11,
            agency_id: 2,
            agency_name: "Astra Travels",
            price: 15000,
            available_dates: "2026-05-01|2026-05-05",
            start_date: "2026-05-01",
            end_date: "2026-05-05",
          },
        ],
      });
    });
  });
});