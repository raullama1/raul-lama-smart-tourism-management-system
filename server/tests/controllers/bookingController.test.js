// server/tests/controllers/bookingController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  db: {
    query: vi.fn(),
  },
}));

vi.mock("../../models/bookingModel.js", () => ({
  getUserBookings: vi.fn(),
  markBookingPaid: vi.fn(),
  cancelBooking: vi.fn(),
  fetchBookingPreviewByAgencyTourId: vi.fn(),
  insertBooking: vi.fn(),
}));

vi.mock("../../models/notificationModel.js", () => ({
  createNotification: vi.fn(),
}));

const { db } = await import("../../db.js");

const {
  getUserBookings,
  markBookingPaid,
  cancelBooking,
  fetchBookingPreviewByAgencyTourId,
  insertBooking,
} = await import("../../models/bookingModel.js");

const { createNotification } = await import("../../models/notificationModel.js");

const {
  listMyBookings,
  payBooking,
  cancelMyBooking,
  getBookingPreview,
  createBooking,
} = await import("../../controllers/bookingController.js");

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function mockReq(overrides = {}) {
  return {
    user: { id: 1 },
    query: {},
    params: {},
    body: {},
    app: {
      get: vi.fn(() => ({
        to: vi.fn(() => ({
          emit: vi.fn(),
        })),
      })),
    },
    ...overrides,
  };
}

describe("bookingController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listMyBookings", () => {
    it("should return bookings successfully", async () => {
      const req = mockReq({
        query: { q: "Pokhara", status: "Pending", date: "Last30" },
      });
      const res = mockRes();

      const rows = [{ id: 1, ref_code: "NP-POKH-1234" }];
      getUserBookings.mockResolvedValue(rows);

      await listMyBookings(req, res);

      expect(getUserBookings).toHaveBeenCalledWith(1, {
        q: "Pokhara",
        status: "Pending",
        date: "Last30",
      });
      expect(res.json).toHaveBeenCalledWith({ data: rows });
    });

    it("should return 500 when loading bookings fails", async () => {
      const req = mockReq();
      const res = mockRes();

      getUserBookings.mockRejectedValue(new Error("DB error"));

      await listMyBookings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to load bookings.",
      });
    });
  });

  describe("payBooking", () => {
    it("should mark booking paid successfully", async () => {
      const req = mockReq({ params: { bookingId: "5" } });
      const res = mockRes();

      markBookingPaid.mockResolvedValue(true);

      await payBooking(req, res);

      expect(markBookingPaid).toHaveBeenCalledWith(1, "5");
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment marked as paid.",
      });
    });

    it("should return 400 when payment update fails", async () => {
      const req = mockReq({ params: { bookingId: "5" } });
      const res = mockRes();

      markBookingPaid.mockResolvedValue(false);

      await payBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment update failed.",
      });
    });

    it("should return 500 when payBooking throws error", async () => {
      const req = mockReq({ params: { bookingId: "5" } });
      const res = mockRes();

      markBookingPaid.mockRejectedValue(new Error("DB error"));

      await payBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to update payment.",
      });
    });
  });

  describe("cancelMyBooking", () => {
    it("should cancel booking successfully", async () => {
      const req = mockReq({ params: { bookingId: "7" } });
      const res = mockRes();

      cancelBooking.mockResolvedValue(true);
      db.query.mockResolvedValueOnce([
        [
          {
            id: 7,
            ref_code: "NP-POKH-1234",
            agency_id: 9,
            tour_id: 1,
            tour_title: "Pokhara Tour",
          },
        ],
      ]);
      createNotification.mockResolvedValue({ id: 55, title: "Booking cancelled" });

      await cancelMyBooking(req, res);

      expect(cancelBooking).toHaveBeenCalledWith(1, "7");
      expect(createNotification).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking cancelled.",
      });
    });

    it("should return 400 when cancel fails", async () => {
      const req = mockReq({ params: { bookingId: "7" } });
      const res = mockRes();

      cancelBooking.mockResolvedValue(false);

      await cancelMyBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cancel failed.",
      });
    });

    it("should still return success even if no booking row is found after cancel", async () => {
      const req = mockReq({ params: { bookingId: "7" } });
      const res = mockRes();

      cancelBooking.mockResolvedValue(true);
      db.query.mockResolvedValueOnce([[]]);

      await cancelMyBooking(req, res);

      expect(createNotification).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking cancelled.",
      });
    });

    it("should return 500 when cancel throws error", async () => {
      const req = mockReq({ params: { bookingId: "7" } });
      const res = mockRes();

      cancelBooking.mockRejectedValue(new Error("DB error"));

      await cancelMyBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to cancel booking.",
      });
    });
  });

  describe("getBookingPreview", () => {
    it("should return 400 when agencyTourId is missing", async () => {
      const req = mockReq({ params: {} });
      const res = mockRes();

      await getBookingPreview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "agencyTourId is required.",
      });
    });

    it("should return 404 when preview is not found", async () => {
      const req = mockReq({ params: { agencyTourId: "10" } });
      const res = mockRes();

      fetchBookingPreviewByAgencyTourId.mockResolvedValue(null);

      await getBookingPreview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking preview not found (inactive or missing).",
      });
    });

    it("should return preview successfully", async () => {
      const req = mockReq({ params: { agencyTourId: "10" } });
      const res = mockRes();

      const preview = {
        agency_tour_id: 10,
        tour_title: "Mustang Tour",
        agency_name: "Astra Travels",
      };

      fetchBookingPreviewByAgencyTourId.mockResolvedValue(preview);

      await getBookingPreview(req, res);

      expect(fetchBookingPreviewByAgencyTourId).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({
        data: preview,
      });
    });

    it("should return 500 when preview load fails", async () => {
      const req = mockReq({ params: { agencyTourId: "10" } });
      const res = mockRes();

      fetchBookingPreviewByAgencyTourId.mockRejectedValue(new Error("DB error"));

      await getBookingPreview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to load booking preview.",
      });
    });
  });

  describe("createBooking", () => {
    it("should return 400 when agencyTourId is missing", async () => {
      const req = mockReq({
        body: { travelers: 2, selectedDateLabel: "2026-05-01 → 2026-05-05" },
      });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "agencyTourId is required.",
      });
    });

    it("should return 400 when selectedDateLabel is missing", async () => {
      const req = mockReq({
        body: { agencyTourId: 11, travelers: 2 },
      });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "selectedDateLabel is required.",
      });
    });

    it("should return 400 when travelers is invalid", async () => {
      const req = mockReq({
        body: {
          agencyTourId: 11,
          travelers: 0,
          selectedDateLabel: "2026-05-01 → 2026-05-05",
        },
      });
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "travelers must be between 1 and 99.",
      });
    });

    it("should return 400 when insertBooking returns null", async () => {
      const req = mockReq({
        body: {
          agencyTourId: 11,
          travelers: 2,
          notes: "Window seat",
          selectedDateLabel: "2026-05-01 → 2026-05-05",
        },
      });
      const res = mockRes();

      insertBooking.mockResolvedValue(null);

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Booking failed. The listing may be inactive or the selected date is invalid.",
      });
    });

    it("should create booking successfully", async () => {
      const req = mockReq({
        body: {
          agencyTourId: 11,
          travelers: 2,
          notes: "Window seat",
          selectedDateLabel: "2026-05-01 → 2026-05-05",
        },
      });
      const res = mockRes();

      insertBooking.mockResolvedValue({
        id: 99,
        ref_code: "NP-MUST-1234",
        travelers: 2,
        selected_date_label: "2026-05-01 → 2026-05-05",
        booking_status: "Pending",
        payment_status: "Unpaid",
        total_price: 30000,
      });

      db.query.mockResolvedValueOnce([
        [
          {
            id: 99,
            ref_code: "NP-MUST-1234",
            agency_id: 4,
            tour_title: "Mustang Tour",
            tourist_name: "Raul",
          },
        ],
      ]);

      createNotification.mockResolvedValue({ id: 201, title: "New booking received" });

      await createBooking(req, res);

      expect(insertBooking).toHaveBeenCalledWith({
        userId: 1,
        agencyTourId: 11,
        travelers: 2,
        notes: "Window seat",
        selectedDateLabel: "2026-05-01 → 2026-05-05",
      });

      expect(createNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking created.",
        data: {
          id: 99,
          ref_code: "NP-MUST-1234",
          travelers: 2,
          selected_date_label: "2026-05-01 → 2026-05-05",
          booking_status: "Pending",
          payment_status: "Unpaid",
          total_price: 30000,
        },
      });
    });

    it("should return 500 when createBooking throws error", async () => {
      const req = mockReq({
        body: {
          agencyTourId: 11,
          travelers: 2,
          selectedDateLabel: "2026-05-01 → 2026-05-05",
        },
      });
      const res = mockRes();

      insertBooking.mockRejectedValue(new Error("DB error"));

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to create booking.",
      });
    });
  });
});