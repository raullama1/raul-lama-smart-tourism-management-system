// client/src/api/adminAgenciesApi.js
import apiClient from "./apiClient";

export async function getAdminAgencies(params = {}) {
  const res = await apiClient.get("/admin/agencies", { params });
  return res.data;
}

export async function getAdminAgencyById(agencyId) {
  const res = await apiClient.get(`/admin/agencies/${agencyId}`);
  return res.data;
}

export async function updateAdminAgencyStatus(agencyId, isBlocked) {
  const res = await apiClient.patch(`/admin/agencies/${agencyId}/status`, {
    isBlocked,
  });
  return res.data;
}