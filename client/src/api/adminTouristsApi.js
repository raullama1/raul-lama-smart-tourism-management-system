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

export function buildAdminTouristAvatarUrl(profileImage) {
  if (!profileImage) return "";

  const raw = String(profileImage).trim();
  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const serverBase =
    import.meta.env.VITE_API_ORIGIN ||
    "https://raul-lama-smart-tourism-management-system-production.up.railway.app";

  if (raw.startsWith("/")) {
    return `${serverBase}${raw}`;
  }

  return `${serverBase}/${raw}`;
}