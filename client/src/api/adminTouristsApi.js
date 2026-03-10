// src/api/adminTouristsApi.js
import apiClient from "./apiClient";

export async function getAdminTourists(params = {}) {
  const res = await apiClient.get("/admin/tourists", { params });
  return res.data;
}

export async function getAdminTouristById(userId) {
  const res = await apiClient.get(`/admin/tourists/${userId}`);
  return res.data;
}

export async function updateAdminTouristStatus(userId, isBlocked) {
  const res = await apiClient.patch(`/admin/tourists/${userId}/status`, {
    isBlocked,
  });
  return res.data;
}

export async function deleteAdminTouristReview(userId, reviewId) {
  const res = await apiClient.delete(`/admin/tourists/${userId}/reviews/${reviewId}`);
  return res.data;
}