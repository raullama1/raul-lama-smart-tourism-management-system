// client/src/utils/publicImageUrl.js
const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  "https://raul-lama-smart-tourism-management-system-production.up.railway.app";

export const FALLBACK_TOUR_IMG =
  "https://via.placeholder.com/800x500?text=Tour+Image";

export function toPublicImageUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";

  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
}