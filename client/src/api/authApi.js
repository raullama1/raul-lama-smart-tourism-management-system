// client/src/api/authApi.js
import apiClient from "./apiClient";

// Login
export async function login(email, password) {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data; // { token, user }
}

// Signup (with verificationCode)
export async function signup(name, email, password, verificationCode) {
  const res = await apiClient.post("/auth/signup", {
    name,
    email,
    password,
    verificationCode,
  });
  return res.data; // { token, user }
}

// Validate token + return current user (used on refresh)
export async function me() {
  const res = await apiClient.get("/auth/me");
  return res.data; // { user }
}

// Request signup verification code
export async function requestSignupCode(email) {
  const res = await apiClient.post("/auth/signup/send-code", { email });
  return res.data; // { message }
}

// Forgot password – request reset link
export async function requestPasswordReset(email) {
  const res = await apiClient.post("/auth/forgot-password", { email });
  return res.data;
}

// Reset password with token
export async function resetPassword(token, password) {
  const res = await apiClient.post("/auth/reset-password", {
    token,
    password,
  });
  return res.data;
}

// Change password for logged-in user
export async function changePassword(currentPassword, newPassword) {
  const res = await apiClient.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data; // { message }
}
