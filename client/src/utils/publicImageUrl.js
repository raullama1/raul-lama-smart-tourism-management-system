// client/src/utils/publicImageUrl.js
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const FALLBACK_TOUR_IMG =
  "https://via.placeholder.com/800x500?text=Tour+Image";

export function toPublicImageUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";

  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
}