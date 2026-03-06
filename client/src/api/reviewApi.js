// client/src/api/reviewApi.js
import apiClient from "./apiClient";

export const submitReview = async (payload) => {
  const res = await apiClient.post("/reviews", payload);
  return res.data;
};

export const fetchTourReviews = async ({ tourId, agencyId }) => {
  const res = await apiClient.get("/reviews", {
    params: { tourId, agencyId },
  });
  return res.data;
};

export const updateReview = async (reviewId, payload) => {
  const res = await apiClient.put(`/reviews/${reviewId}`, payload);
  return res.data;
};

export const deleteReview = async (reviewId) => {
  const res = await apiClient.delete(`/reviews/${reviewId}`);
  return res.data;
};