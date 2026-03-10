//
import apiClient from "./apiClient";

export async function getAdminDashboard() {
  const res = await apiClient.get("/admin/dashboard");
  return res.data;
}