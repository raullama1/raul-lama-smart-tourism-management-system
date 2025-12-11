// client/src/api/authApi.js
import apiClient from "./apiClient";

// Login
export async function login(email, password) {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data; // { token, user }
}

// Signup (now with verificationCode)
export async function signup(name, email, password, verificationCode) {
  const res = await apiClient.post("/auth/signup", {
    name,
    email,
    password,
    verificationCode,
  });
  return res.data; // { token, user }
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
