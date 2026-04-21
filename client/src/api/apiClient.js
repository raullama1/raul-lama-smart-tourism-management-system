// client/src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
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

function isAdminEndpoint(url) {
  const u = String(url || "");
  return u.startsWith("/admin/");
}

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  if (!config.headers) {
    config.headers = {};
  }

  if (config.headers.Authorization) {
    return config;
  }

  const url = String(config?.url || "");
  let token = null;

  if (isAgencyEndpoint(url)) {
    token = readTokenFrom("tn_agency_auth");
  } else if (isAdminEndpoint(url)) {
    token = readTokenFrom("tn_admin_auth");
  } else {
    token = readTokenFrom("tn_auth");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;