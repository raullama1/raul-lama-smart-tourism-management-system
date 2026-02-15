import apiClient from "./apiClient";

// Agency login
export async function agencyLogin(email, password) {
  const res = await apiClient.post("/agency/auth/login", { email, password });
  return res.data; // { token, agency }
}

// Agency session
export async function agencyMe() {
  const res = await apiClient.get("/agency/auth/me");
  return res.data; // { agency }
}
