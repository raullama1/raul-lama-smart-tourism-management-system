// server/tests/models/bookingModel.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  db: {
    query: vi.fn(),
  },
}));

const { db } = await import("../../db.js");
const bookingModel = await import("../../models/bookingModel.js");

const {
  getUserBookings,
  markBookingPaid,
  cancelBooking,
  fetchBookingPreviewByAgencyTourId,
  insertBooking,
} = bookingModel;

describe("bookingModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserBookings", () => {
    it("should return booking rows", async () => {
      const rows = [
        {
          id: 1,
          ref_code: "NP-POKH-1234",
          booking_status: "Pending",
          payment_status: "Unpaid",
        },
      ];

      db.query.mockResolvedValueOnce([rows]);

      const result = await getUserBookings(1, {
        q: "Pokhara",
        status: "Pending",
        date: "Last30",
      });

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe("markBookingPaid", () => {
    it("should return false when booking is not found", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await markBookingPaid(1, 10);

      expect(result).toBe(false);
    });

    it("should return false when booking is cancelled", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 10,
            booking_status: "Cancelled",
            payment_status: "Unpaid",
            listing_status: "active",
          },
        ],
      ]);

      const result = await markBookingPaid(1, 10);

      expect(result).toBe(false);
    });

    it("should return true when payment is already marked paid", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 10,
            booking_status: "Approved",
            payment_status: "Paid",
            listing_status: "active",
          },
        ],
      ]);

      const result = await markBookingPaid(1, 10);

      expect(result).toBe(true);
    });

    it("should update booking to Confirmed when approved and active", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            {
              id: 10,
              booking_status: "Approved",
              payment_status: "Unpaid",
              listing_status: "active",
            },
          ],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await markBookingPaid(1, 10);

      expect(result).toBe(true);
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE bookings"),
        ["Confirmed", 10, 1]
      );
    });

    it("should update booking to Completed when listing is completed", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            {
              id: 10,
              booking_status: "Approved",
              payment_status: "Unpaid",
              listing_status: "completed",
            },
          ],
        ])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await markBookingPaid(1, 10);

      expect(result).toBe(true);
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE bookings"),
        ["Completed", 10, 1]
      );
    });
  });

  describe("cancelBooking", () => {
    it("should return true when booking is cancelled", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await cancelBooking(1, 20);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE bookings"),
        [20, 1]
      );
      expect(result).toBe(true);
    });

    it("should return false when booking is not cancelled", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await cancelBooking(1, 20);

      expect(result).toBe(false);
    });
  });

  describe("fetchBookingPreviewByAgencyTourId", () => {
    it("should return null when preview row is not found", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await fetchBookingPreviewByAgencyTourId(11);

      expect(result).toBeNull();
    });

    it("should return preview with normalized dates", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            agency_tour_id: 11,
            tour_id: 2,
            agency_id: 5,
            price: 15000,
            available_dates: "2026-05-01|2026-05-05",
            start_date: null,
            end_date: null,
            listing_status: "active",
            tour_title: "Mustang Tour",
            agency_name: "Astra Travels",
          },
        ],
      ]);

      const result = await fetchBookingPreviewByAgencyTourId(11);

      expect(result).toEqual({
        agency_tour_id: 11,
        tour_id: 2,
        agency_id: 5,
        price: 15000,
        available_dates: "2026-05-01|2026-05-05",
        start_date: "2026-05-01",
        end_date: "2026-05-05",
        listing_status: "active",
        tour_title: "Mustang Tour",
        agency_name: "Astra Travels",
      });
    });
  });

  describe("insertBooking", () => {
    it("should return null when preview is not found", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await insertBooking({
        userId: 1,
        agencyTourId: 11,
        travelers: 2,
        notes: "test",
        selectedDateLabel: "2026-05-01 → 2026-05-05",
      });

      expect(result).toBeNull();
    });

    it("should return null when selected date label does not match", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            agency_tour_id: 11,
            tour_id: 2,
            agency_id: 5,
            price: 15000,
            available_dates: "2026-05-01|2026-05-05",
            start_date: "2026-05-01",
            end_date: "2026-05-05",
            listing_status: "active",
            tour_title: "Mustang Tour",
            agency_name: "Astra Travels",
          },
        ],
      ]);

      const result = await insertBooking({
        userId: 1,
        agencyTourId: 11,
        travelers: 2,
        notes: "test",
        selectedDateLabel: "2026-06-01 → 2026-06-05",
      });

      expect(result).toBeNull();
    });

    it("should return null when travelers is invalid", async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            agency_tour_id: 11,
            tour_id: 2,
            agency_id: 5,
            price: 15000,
            available_dates: "2026-05-01|2026-05-05",
            start_date: "2026-05-01",
            end_date: "2026-05-05",
            listing_status: "active",
            tour_title: "Mustang Tour",
            agency_name: "Astra Travels",
          },
        ],
      ]);

      const result = await insertBooking({
        userId: 1,
        agencyTourId: 11,
        travelers: 0,
        notes: "test",
        selectedDateLabel: "2026-05-01 → 2026-05-05",
      });

      expect(result).toBeNull();
    });

    it("should insert booking successfully", async () => {
      db.query
        .mockResolvedValueOnce([
          [
            {
              agency_tour_id: 11,
              tour_id: 2,
              agency_id: 5,
              price: 15000,
              available_dates: "2026-05-01|2026-05-05",
              start_date: "2026-05-01",
              end_date: "2026-05-05",
              listing_status: "active",
              tour_title: "Mustang Tour",
              agency_name: "Astra Travels",
            },
          ],
        ])
        .mockResolvedValueOnce([{ insertId: 77 }]);

      const result = await insertBooking({
        userId: 1,
        agencyTourId: 11,
        travelers: 2,
        notes: "test",
        selectedDateLabel: "2026-05-01 → 2026-05-05",
      });

      expect(result).toEqual({
        id: 77,
        ref_code: expect.stringMatching(/^NP-[A-Z]{4}-\d{4}$/),
        travelers: 2,
        selected_date_label: "2026-05-01 → 2026-05-05",
        booking_status: "Pending",
        payment_status: "Unpaid",
        total_price: 30000,
      });
    });
  });
});