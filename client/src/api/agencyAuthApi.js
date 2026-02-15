// client/src/api/agencyAuthApi.js
import apiClient from "./apiClient";

/**
 * Send agency register verification code to email
 */
export async function requestAgencySignupCode(email) {
  const res = await apiClient.post("/agency/auth/register/send-code", { email });
  return res.data; // { message }
}

/**
 * Register agency with verification code
 */
export async function agencyRegister(payload) {
  const res = await apiClient.post("/agency/auth/register", payload);
  return res.data; // { token, agency }
}

/**
 * Agency login
 */
export async function agencyLogin(email, password) {
  const res = await apiClient.post("/agency/auth/login", { email, password });
  return res.data; // { token, agency }
}

/**
 * Get current authenticated agency
 */
export async function agencyMe() {
  const res = await apiClient.get("/agency/auth/me");
  return res.data; // { agency }
}

/**
 * Check availability of agency fields (name/email/phone/pan)
 */
export async function checkAgencyAvailability(payload) {
  const res = await apiClient.post("/agency/auth/register/check", payload);
  return res.data; // { taken: { email, phone, pan_vat, name } }
}
