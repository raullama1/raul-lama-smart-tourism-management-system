// client/src/api/profileApi.js
import api from "./apiClient";

export function fetchMyProfile(token) {
  return api.get("/profile/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateMyProfile(token, payload) {
  return api.put("/profile/me", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function uploadMyAvatar(token, file) {
  const form = new FormData();
  form.append("avatar", file);

  return api.post("/profile/me/avatar", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function removeMyAvatar(token) {
  return api.delete("/profile/me/avatar", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function buildAvatarUrl(profileImage) {
  if (!profileImage) return "";

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  const base = String(apiUrl).replace(/\/api\/?$/, "");
  const p = String(profileImage).replaceAll("\\", "/").replace(/^\/+/, "");

  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  if (p.startsWith("uploads/")) {
    return `${base}/${p}`;
  }

  return `${base}/uploads/avatars/${p}`;
}