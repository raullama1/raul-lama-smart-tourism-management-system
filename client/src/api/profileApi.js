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

/**
 * profile_image can be:
 * - null
 * - "u12-123.jpg" (filename only)
 * - "uploads/avatars/u12-123.jpg" (relative path)
 */
export function buildAvatarUrl(profileImage) {
  if (!profileImage) return "";

  // Use your server default port (your server.js uses 5001)
  const base = import.meta.env.VITE_API_URL || "http://localhost:5001";
  const cleanBase = String(base).replace(/\/$/, "");

  const p = String(profileImage).replaceAll("\\", "/").replace(/^\/+/, "");

  // If it's already a full URL, return it
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  // If DB stored "uploads/avatars/xxx.jpg", convert to "/uploads/avatars/xxx.jpg"
  if (p.startsWith("uploads/")) {
    return `${cleanBase}/${p}`;
  }

  // Otherwise treat as filename
  return `${cleanBase}/uploads/avatars/${p}`;
}
