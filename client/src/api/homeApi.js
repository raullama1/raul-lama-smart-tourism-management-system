// client/src/api/homeApi.js
import apiClient from "./apiClient";

// GET /api/public/home
export async function fetchPublicHomeData() {
  const res = await apiClient.get("/public/home");
  return res.data;
}

// GET /api/public/home/recommendations
export async function fetchTourRecommendations() {
  const res = await apiClient.get("/public/home/recommendations");
  return res.data;
}