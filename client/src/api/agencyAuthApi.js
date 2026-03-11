// client/src/api/agencyAuthApi.js
import apiClient from "./apiClient";

export async function requestAgencySignupCode(email) {
  const res = await apiClient.post("/agency/auth/register/send-code", { email });
  return res.data;
}

export async function agencyRegister(payload) {
  const res = await apiClient.post("/agency/auth/register", payload);
  return res.data;
}

export async function agencyLogin(email, password) {
  const res = await apiClient.post("/agency/auth/login", { email, password });
  return res.data;
}

export async function agencyMe() {
  const res = await apiClient.get("/agency/auth/me");
  return res.data;
}

export async function checkAgencyAvailability(payload) {
  const res = await apiClient.post("/agency/auth/register/check", payload);
  return res.data;
}

export async function agencyRequestPasswordReset(email) {
  const res = await apiClient.post("/agency/auth/forgot-password", { email });
  return res.data;
}

export async function agencyResetPassword(token, password) {
  const res = await apiClient.post("/agency/auth/reset-password", { token, password });
  return res.data;
}