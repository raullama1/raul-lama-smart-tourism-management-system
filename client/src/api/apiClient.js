import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 10000,
});

// Attach JWT token automatically
apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const url = String(config?.url || "");
  const isAgencyRequest = url.startsWith("/agency/") || url.includes("/agency/");

  const key = isAgencyRequest ? "tn_agency_auth" : "tn_auth";
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore parse error
    }
  }

  return config;
});

export default apiClient;
