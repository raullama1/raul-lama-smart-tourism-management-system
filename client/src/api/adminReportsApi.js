// client/src/api/adminReportsApi.js
import apiClient from "./apiClient";

export async function getAdminReports() {
  const res = await apiClient.get("/admin/reports");
  return res.data;
}