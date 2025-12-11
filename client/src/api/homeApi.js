// client/src/api/homeApi.js
import apiClient from "./apiClient";

// GET /api/public/home
export async function fetchPublicHomeData() {
  const res = await apiClient.get("/public/home");
  return res.data; // { popularTours, featuredTours, recentBlogs, etc. }
}
