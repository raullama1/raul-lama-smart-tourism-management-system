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

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const url = String(config?.url || "");
  const isAgencyCall = url.startsWith("/agency/");

  const token = isAgencyCall
    ? readTokenFrom("tn_agency_auth")
    : readTokenFrom("tn_auth");

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export default apiClient;
