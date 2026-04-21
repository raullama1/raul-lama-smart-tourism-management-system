// server/tests/controllers/paymentController.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../models/notificationModel.js", () => ({
  createNotification: vi.fn(),
}));

vi.mock("../../models/paymentModel.js", () => ({
  getBookingForPayment: vi.fn(),
  markBookingPaid: vi.fn(),
  getBookingNotificationInfo: vi.fn(),
}));

const axios = (await import("axios")).default;
const { createNotification } = await import("../../models/notificationModel.js");
const {
  getBookingForPayment,
  markBookingPaid,
  getBookingNotificationInfo,
} = await import("../../models/paymentModel.js");

const {
  initiateEsewaPayment,
  esewaSuccess,
  esewaFailure,
} = await import("../../controllers/paymentController.js");

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
  };
}

function mockReq(overrides = {}) {
  return {
    user: { id: 1 },
    body: {},
    query: {},
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

function makeEsewaData({
  total_amount = "5000",
  transaction_uuid = "BK-12-1711111111111-abcd12",
  product_code = "EPAYTEST",
  status = "COMPLETE",
  secretKey = "secret123",
} = {}) {
  const body = {
    total_amount,
    transaction_uuid,
    product_code,
    status,
    signed_field_names: "total_amount,transaction_uuid,product_code",
  };

  const signedStr = `total_amount=${body.total_amount},transaction_uuid=${body.transaction_uuid},product_code=${body.product_code}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signedStr, "utf8")
    .digest("base64");

  body.signature = signature;

  return Buffer.from(JSON.stringify(body), "utf8").toString("base64");
}

describe("paymentController", () => {
  const oldEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ESEWA_SECRET_KEY = "secret123";
    process.env.ESEWA_PRODUCT_CODE = "EPAYTEST";
    process.env.API_BASE_URL = "http://localhost:5000";
    process.env.CLIENT_URL = "http://localhost:5173";
    process.env.ESEWA_MODE = "test";
  });

  afterEach(() => {
    process.env = { ...oldEnv };
  });

  describe("initiateEsewaPayment", () => {
    it("should return 400 when bookingId is missing", async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await initiateEsewaPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "bookingId is required.",
      });
    });

    it("should return 404 when booking is not found", async () => {
      const req = mockReq({ body: { bookingId: 10 } });
      const res = mockRes();

      getBookingForPayment.mockResolvedValue(null);

      await initiateEsewaPayment(req, res);

      expect(getBookingForPayment).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Booking not found.",
      });
    });

    it("should return 400 when payment is not allowed", async () => {
      const req = mockReq({ body: { bookingId: 10 } });
      const res = mockRes();

      getBookingForPayment.mockResolvedValue({
        id: 10,
        total_price: 5000,
        booking_status: "Pending",
        payment_status: "Unpaid",
      });

      await initiateEsewaPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment not allowed for this booking.",
      });
    });

    it("should return 500 when secret key is missing", async () => {
      process.env.ESEWA_SECRET_KEY = "";

      const req = mockReq({ body: { bookingId: 10 } });
      const res = mockRes();

      getBookingForPayment.mockResolvedValue({
        id: 10,
        total_price: 5000,
        booking_status: "Approved",
        payment_status: "Unpaid",
      });

      await initiateEsewaPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "eSewa secret key is missing.",
      });
    });

    it("should initiate payment successfully", async () => {
      const req = mockReq({ body: { bookingId: 10 } });
      const res = mockRes();

      getBookingForPayment.mockResolvedValue({
        id: 10,
        total_price: 5000,
        booking_status: "Approved",
        payment_status: "Unpaid",
      });

      await initiateEsewaPayment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        data: {
          esewaUrl: expect.any(String),
          formData: expect.objectContaining({
            amount: "5000",
            total_amount: "5000",
            product_code: "EPAYTEST",
            transaction_uuid: expect.stringMatching(/^BK-10-/),
            signature: expect.any(String),
          }),
        },
      });
    });

    it("should return 500 when initiate payment throws error", async () => {
      const req = mockReq({ body: { bookingId: 10 } });
      const res = mockRes();

      getBookingForPayment.mockRejectedValue(new Error("DB error"));

      await initiateEsewaPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to initiate eSewa payment.",
      });
    });
  });

  describe("esewaSuccess", () => {
    it("should redirect to failure when data is missing", async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await esewaSuccess(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/0?reason=missing_data"
      );
    });

    it("should redirect to failure on signature mismatch", async () => {
      const badBody = {
        total_amount: "5000",
        transaction_uuid: "BK-12-1711111111111-abcd12",
        product_code: "EPAYTEST",
        status: "COMPLETE",
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: "wrong-signature",
      };

      const req = mockReq({
        query: {
          data: Buffer.from(JSON.stringify(badBody), "utf8").toString("base64"),
        },
      });
      const res = mockRes();

      await esewaSuccess(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/0?reason=signature_mismatch"
      );
    });

    it("should redirect to failure when status is not complete", async () => {
      const req = mockReq({
        query: {
          data: makeEsewaData({ status: "PENDING" }),
        },
      });
      const res = mockRes();

      axios.get.mockResolvedValueOnce({ data: { status: "PENDING" } });

      await esewaSuccess(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/12?reason=not_complete"
      );
    });

    it("should mark booking paid and redirect to success", async () => {
      const req = mockReq({
        query: {
          data: makeEsewaData({ status: "COMPLETE" }),
        },
      });
      const res = mockRes();

      axios.get.mockResolvedValueOnce({
        data: {
          status: "COMPLETE",
          transaction_code: "TXN123",
          ref_id: "REF123",
        },
      });

      markBookingPaid.mockResolvedValue(true);
      getBookingNotificationInfo.mockResolvedValue({
        id: 12,
        user_id: 1,
        agency_id: 5,
        ref_code: "NP-MUST-1234",
        tour_title: "Mustang Tour",
      });
      createNotification.mockResolvedValue({ id: 1 });

      await esewaSuccess(req, res);

      expect(markBookingPaid).toHaveBeenCalledWith(12, {
        esewaRefId: "REF123",
        esewaTransactionCode: "TXN123",
      });
      expect(createNotification).toHaveBeenCalledTimes(2);
      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/success/12"
      );
    });

    it("should redirect to server_error on exception", async () => {
      const req = mockReq({
        query: {
          data: "not-valid-base64-json",
        },
      });
      const res = mockRes();

      await esewaSuccess(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/0?reason=server_error"
      );
    });
  });

  describe("esewaFailure", () => {
    it("should redirect to cancelled when data is missing", async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await esewaFailure(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/0?reason=cancelled"
      );
    });

    it("should redirect to cancelled with booking id when data is valid", async () => {
      const body = {
        transaction_uuid: "BK-45-1711111111111-abcd12",
      };

      const req = mockReq({
        query: {
          data: Buffer.from(JSON.stringify(body), "utf8").toString("base64"),
        },
      });
      const res = mockRes();

      await esewaFailure(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/45?reason=cancelled"
      );
    });

    it("should redirect to cancelled on parse error", async () => {
      const req = mockReq({
        query: {
          data: "%%%bad-json%%%",
        },
      });
      const res = mockRes();

      await esewaFailure(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        "http://localhost:5173/payment/failure/0?reason=cancelled"
      );
    });
  });
});