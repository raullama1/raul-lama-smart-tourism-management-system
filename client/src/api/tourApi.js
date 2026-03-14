// client/src/api/tourApi.js
import apiClient from "./apiClient";

// GET /api/public/tours
export async function fetchPublicTours(params = {}) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const url = query ? `/public/tours?${query}` : `/public/tours`;

  const res = await apiClient.get(url);
  return res.data;
}

// GET /api/public/tours/suggestions?q=
export async function fetchPublicTourSuggestions(q) {
  const res = await apiClient.get("/public/tours/suggestions", {
    params: { q },
  });
  return res.data;
}

// GET /api/public/tours/:tourId
export async function fetchPublicTourDetails(tourId) {
  const res = await apiClient.get(`/public/tours/${tourId}`);
  return res.data;
}

// GET tours for map view
export const fetchTourMapTours = async () => {
  const res = await apiClient.get("/public/tours", {
    params: { page: 1, limit: 1000 },
  });

  return res.data;
};