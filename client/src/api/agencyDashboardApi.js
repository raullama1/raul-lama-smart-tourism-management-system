// client/src/api/agencyDashboardApi.js
import apiClient from "./apiClient";

function getAgencyToken() {
  try {
    const raw = localStorage.getItem("tn_agency_auth");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export async function getAgencyDashboard() {
  const token = getAgencyToken();

  const res = await apiClient.get("/agency/dashboard", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return res.data; // { stats, recentBookings, recentReviews }
}
