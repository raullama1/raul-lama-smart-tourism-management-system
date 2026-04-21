// server/tests/controllers/authController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db.js", () => ({
  db: {
    query: vi.fn(),
  },
}));

vi.mock("../../models/userModel.js", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUserPasswordHash: vi.fn(),
}));

vi.mock("../../models/agencyModel.js", () => ({
  findAgencyByEmail: vi.fn(),
}));

vi.mock("../../models/emailVerificationModel.js", () => ({
  createEmailVerification: vi.fn(),
  findValidEmailVerification: vi.fn(),
  markVerificationUsed: vi.fn(),
}));

vi.mock("../../utils/mailer.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendSignupVerificationEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock-token"),
  },
}));

const { db } = await import("../../db.js");
const bcrypt = (await import("bcryptjs")).default;

const {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPasswordHash,
} = await import("../../models/userModel.js");

const { findAgencyByEmail } = await import("../../models/agencyModel.js");

const {
  createEmailVerification,
  findValidEmailVerification,
  markVerificationUsed,
} = await import("../../models/emailVerificationModel.js");

const {
  sendPasswordResetEmail,
  sendSignupVerificationEmail,
} = await import("../../utils/mailer.js");

const {
  sendSignupVerificationCodeController,
  signupController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  meController,
} = await import("../../controllers/authController.js");

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("authController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendSignupVerificationCodeController", () => {
    it("should return 400 when email is missing", async () => {
      const req = { body: {} };
      const res = mockRes();

      await sendSignupVerificationCodeController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email is required to send verification code.",
      });
    });

    it("should return 400 when email already belongs to agency", async () => {
      const req = { body: { email: "agency@test.com" } };
      const res = mockRes();

      findAgencyByEmail.mockResolvedValue({ id: 1 });

      await sendSignupVerificationCodeController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "This email is already registered as an agency. Please use a different email for user.",
      });
    });

    it("should send verification code successfully", async () => {
      const req = { body: { email: "user@test.com" } };
      const res = mockRes();

      findAgencyByEmail.mockResolvedValue(null);
      findUserByEmail.mockResolvedValue(null);
      createEmailVerification.mockResolvedValue({ id: 1 });
      sendSignupVerificationEmail.mockResolvedValue();

      await sendSignupVerificationCodeController(req, res);

      expect(createEmailVerification).toHaveBeenCalled();
      expect(sendSignupVerificationEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Verification code sent. Please check your email. Code is valid for 60 seconds.",
      });
    });
  });

  describe("signupController", () => {
    it("should return 400 when required fields are missing", async () => {
      const req = { body: { name: "", email: "", password: "", verificationCode: "" } };
      const res = mockRes();

      await signupController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Name, email, password, and verification code are required.",
      });
    });

    it("should return 400 for weak password", async () => {
      const req = {
        body: {
          name: "Test User",
          email: "user@test.com",
          password: "weak",
          verificationCode: "123456",
        },
      };
      const res = mockRes();

      findAgencyByEmail.mockResolvedValue(null);

      await signupController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Password is too weak. Please follow the rules.",
        })
      );
    });

    it("should signup successfully with valid data", async () => {
      const req = {
        body: {
          name: "Test User",
          email: "user@test.com",
          password: "Strong@123",
          verificationCode: "123456",
        },
      };
      const res = mockRes();

      findAgencyByEmail.mockResolvedValue(null);
      findUserByEmail.mockResolvedValue(null);
      findValidEmailVerification.mockResolvedValue({ id: 7 });
      bcrypt.hash.mockResolvedValue("hashed-password");
      createUser.mockResolvedValue({
        id: 10,
        name: "Test User",
        email: "user@test.com",
        role: "tourist",
        is_blocked: 0,
      });
      markVerificationUsed.mockResolvedValue();

      await signupController(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("Strong@123", 10);
      expect(createUser).toHaveBeenCalledWith({
        name: "Test User",
        email: "user@test.com",
        passwordHash: "hashed-password",
        role: "tourist",
      });
      expect(markVerificationUsed).toHaveBeenCalledWith(7);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: "mock-token",
        user: {
          id: 10,
          name: "Test User",
          email: "user@test.com",
          role: "tourist",
          is_blocked: false,
        },
      });
    });
  });

  describe("loginController", () => {
    it("should return 400 when email or password is missing", async () => {
      const req = { body: { email: "", password: "" } };
      const res = mockRes();

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required.",
      });
    });

    it("should return 400 when user does not exist", async () => {
      const req = { body: { email: "user@test.com", password: "Strong@123" } };
      const res = mockRes();

      findUserByEmail.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password.",
      });
    });

    it("should return 403 when user is blocked", async () => {
      const req = { body: { email: "user@test.com", password: "Strong@123" } };
      const res = mockRes();

      findUserByEmail.mockResolvedValue({
        id: 1,
        name: "Blocked User",
        email: "user@test.com",
        password_hash: "hashed",
        role: "tourist",
        is_blocked: 1,
      });

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Your account has been blocked. Please contact support.",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const req = { body: { email: "user@test.com", password: "Strong@123" } };
      const res = mockRes();

      findUserByEmail.mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "user@test.com",
        password_hash: "hashed-password",
        role: "tourist",
        is_blocked: 0,
      });
      bcrypt.compare.mockResolvedValue(true);

      await loginController(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith("Strong@123", "hashed-password");
      expect(res.json).toHaveBeenCalledWith({
        token: "mock-token",
        user: {
          id: 1,
          name: "Test User",
          email: "user@test.com",
          role: "tourist",
          is_blocked: false,
        },
      });
    });
  });

  describe("forgotPasswordController", () => {
    it("should return 400 when email is missing", async () => {
      const req = { body: {} };
      const res = mockRes();

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email is required.",
      });
    });

    it("should respond safely even when user does not exist", async () => {
      const req = { body: { email: "nouser@test.com" } };
      const res = mockRes();

      findUserByEmail.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message:
          "Password reset link sent successfully. It is valid for 60 seconds. Please check your inbox.",
      });
    });

    it("should create reset token and send email for valid user", async () => {
      const req = { body: { email: "user@test.com" } };
      const res = mockRes();

      findUserByEmail.mockResolvedValue({
        id: 5,
        email: "user@test.com",
        role: "tourist",
        is_blocked: 0,
      });
      db.query.mockResolvedValue([{}]);
      sendPasswordResetEmail.mockResolvedValue();

      await forgotPasswordController(req, res);

      expect(db.query).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message:
          "If an account with that email exists, a reset link (valid for 60 seconds and one-time use) has been sent.",
      });
    });
  });

  describe("resetPasswordController", () => {
    it("should return 400 when token or password is missing", async () => {
      const req = { body: { token: "", password: "" } };
      const res = mockRes();

      await resetPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token and new password are required.",
      });
    });

    it("should return 400 when token record is not found", async () => {
      const req = { body: { token: "abc", password: "Strong@123" } };
      const res = mockRes();

      db.query.mockResolvedValueOnce([[]]);

      await resetPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "This password reset link is invalid or has already been used.",
      });
    });

    it("should reset password successfully", async () => {
      const req = { body: { token: "abc", password: "Strong@123" } };
      const res = mockRes();

      db.query
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              user_id: 9,
              token: "abc",
              expires_at: new Date(Date.now() + 60000).toISOString(),
              used_at: null,
            },
          ],
        ])
        .mockResolvedValueOnce([{}]);

      findUserById.mockResolvedValue({
        id: 9,
        role: "tourist",
        is_blocked: 0,
      });

      bcrypt.hash.mockResolvedValue("new-hash");
      updateUserPasswordHash.mockResolvedValue();

      await resetPasswordController(req, res);

      expect(updateUserPasswordHash).toHaveBeenCalledWith(9, "new-hash");
      expect(res.json).toHaveBeenCalledWith({
        message: "Password has been reset successfully.",
      });
    });
  });

  describe("changePasswordController", () => {
    it("should return 401 when user is not authenticated", async () => {
      const req = { user: null, body: {} };
      const res = mockRes();

      await changePasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentication required.",
      });
    });

    it("should return 400 when current password is wrong", async () => {
      const req = {
        user: { id: 2, role: "tourist" },
        body: {
          currentPassword: "Wrong@123",
          newPassword: "NewStrong@123",
        },
      };
      const res = mockRes();

      findUserById.mockResolvedValue({
        id: 2,
        role: "tourist",
        is_blocked: 0,
        password_hash: "old-hash",
      });
      bcrypt.compare.mockResolvedValue(false);

      await changePasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Current password is incorrect.",
      });
    });

    it("should change password successfully", async () => {
      const req = {
        user: { id: 2, role: "tourist" },
        body: {
          currentPassword: "OldStrong@123",
          newPassword: "NewStrong@123",
        },
      };
      const res = mockRes();

      findUserById.mockResolvedValue({
        id: 2,
        role: "tourist",
        is_blocked: 0,
        password_hash: "old-hash",
      });
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("new-hash");
      updateUserPasswordHash.mockResolvedValue();

      await changePasswordController(req, res);

      expect(updateUserPasswordHash).toHaveBeenCalledWith(2, "new-hash");
      expect(res.json).toHaveBeenCalledWith({
        message: "Password updated successfully.",
      });
    });
  });

  describe("meController", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null };
      const res = mockRes();

      await meController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentication required.",
      });
    });

    it("should return user data successfully", async () => {
      const req = { user: { id: 1 } };
      const res = mockRes();

      db.query.mockResolvedValue([
        [
          {
            id: 1,
            name: "Test User",
            email: "user@test.com",
            role: "tourist",
            is_blocked: 0,
          },
        ],
      ]);

      await meController(req, res);

      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: 1,
          name: "Test User",
          email: "user@test.com",
          role: "tourist",
          is_blocked: false,
        },
      });
    });
  });
});