// src/api/adminTouristsApi.js
import apiClient from "./apiClient";

export async function getAdminTourists(params = {}) {
  const res = await apiClient.get("/admin/tourists", { params });
  return res.data;
}

export async function updateAdminTouristStatus(userId, isBlocked) {
  const res = await apiClient.patch(`/admin/tourists/${userId}/status`, {
    isBlocked,
  });
  return res.data;
}