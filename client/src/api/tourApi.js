// client/src/api/tourApi.js
import apiClient from "./apiClient";

// GET /api/public/tours
export async function fetchPublicTours(params = {}) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const url = query ? `/public/tours?${query}` : `/public/tours`;

  const res = await apiClient.get(url);
  return res.data; // { data: [...], pagination: {...} }
}

// GET /api/public/tours/:tourId
export async function fetchPublicTourDetails(tourId) {
  const res = await apiClient.get(`/public/tours/${tourId}`);
  return res.data; // { tour, agencies }
}
