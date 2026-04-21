// server/tests/models/paymentModel.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  db: {
    query: vi.fn(),
  },
}));

const { db } = await import("../../db.js");
const {
  getBookingForPayment,
  markBookingPaid,
  getBookingNotificationInfo,
} = await import("../../models/paymentModel.js");

describe("paymentModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBookingForPayment", () => {
    it("should return booking when found", async () => {
      const booking = {
        id: 10,
        user_id: 1,
        total_price: 5000,
        booking_status: "Approved",
        payment_status: "Unpaid",
        ref_code: "NP-POKH-1234",
      };

      db.query.mockResolvedValueOnce([[booking]]);

      const result = await getBookingForPayment(1, 10);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [10, 1]);
      expect(result).toEqual(booking);
    });

    it("should return null when booking is not found", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await getBookingForPayment(1, 10);

      expect(result).toBeNull();
    });
  });

  describe("markBookingPaid", () => {
    it("should return true when booking payment is updated", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await markBookingPaid(10, {
        esewaRefId: "REF123",
        esewaTransactionCode: "TXN123",
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE bookings"),
        ["REF123", "TXN123", 10]
      );
      expect(result).toBe(true);
    });

    it("should return false when no booking is updated", async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await markBookingPaid(10, {
        esewaRefId: "REF123",
        esewaTransactionCode: "TXN123",
      });

      expect(result).toBe(false);
    });
  });

  describe("getBookingNotificationInfo", () => {
    it("should return booking notification info when found", async () => {
      const info = {
        id: 10,
        user_id: 1,
        agency_id: 3,
        ref_code: "NP-POKH-1234",
        tour_title: "Pokhara Tour",
      };

      db.query.mockResolvedValueOnce([[info]]);

      const result = await getBookingNotificationInfo(10);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [10]);
      expect(result).toEqual(info);
    });

    it("should return null when booking notification info is not found", async () => {
      db.query.mockResolvedValueOnce([[]]);

      const result = await getBookingNotificationInfo(10);

      expect(result).toBeNull();
    });
  });
});