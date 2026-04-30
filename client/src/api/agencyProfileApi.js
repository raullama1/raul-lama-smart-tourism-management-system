// client/src/api/agencyProfileApi.js
import apiClient from "./apiClient";

export async function fetchAgencyProfile(token) {
  const res = await apiClient.get("/agency/profile/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export async function updateAgencyProfile(token, payload) {
  const res = await apiClient.put("/agency/profile/me", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export async function uploadAgencyAvatar(token, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await apiClient.post("/agency/profile/me/avatar", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function removeAgencyAvatar(token) {
  const res = await apiClient.delete("/agency/profile/me/avatar", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export async function changeAgencyPassword(token, payload) {
  const res = await apiClient.put("/agency/profile/me/password", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export function buildAgencyAvatarUrl(profileImage) {
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