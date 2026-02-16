// client/src/api/agencyToursApi.js
import apiClient from "./apiClient";

export async function createAgencyTour(formData) {
  const res = await apiClient.post("/agency/tours", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
