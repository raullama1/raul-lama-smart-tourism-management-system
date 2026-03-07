// client/src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
});

function readTokenFrom(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function isAgencyEndpoint(url) {
  const u = String(url || "");

  if (u.startsWith("/agency/")) return true;

  if (u.startsWith("/chat/agency")) return true;
  if (u === "/chat/tourists" || u.startsWith("/chat/tourists/")) return true;

  return false;
}

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  if (!config.headers) {
    config.headers = {};
  }

  // Keep explicit Authorization header if caller already provided one.
  if (config.headers.Authorization) {
    return config;
  }

  const url = String(config?.url || "");
  const token = isAgencyEndpoint(url)
    ? readTokenFrom("tn_agency_auth")
    : readTokenFrom("tn_auth");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;