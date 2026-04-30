// client/src/api/adminReviewsApi.js
import apiClient from "./apiClient";

export async function getAdminReviews(params = {}) {
  const res = await apiClient.get("/admin/reviews", { params });
  return res.data;
}

export async function deleteAdminReview(reviewId) {
  const res = await apiClient.delete(`/admin/reviews/${reviewId}`);
  return res.data;
}