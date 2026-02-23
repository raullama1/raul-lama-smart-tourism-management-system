// client/src/api/agencyToursApi.js
import apiClient from "./apiClient";

export async function createAgencyTour(formData) {
  const res = await apiClient.post("/agency/tours", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function fetchAgencyManageTours(params = {}) {
  const sp = new URLSearchParams(params);
  const query = sp.toString();
  const url = query ? `/agency/tours/manage?${query}` : `/agency/tours/manage`;

  const res = await apiClient.get(url);
  return res.data; // { data: [...] }
}

export async function updateAgencyTourStatus(agencyTourId, status) {
  const res = await apiClient.patch(`/agency/tours/manage/${agencyTourId}/status`, {
    status,
  });
  return res.data;
}

export async function deleteAgencyTour(agencyTourId) {
  const res = await apiClient.delete(`/agency/tours/manage/${agencyTourId}`);
  return res.data;
}

export async function updateAgencyTour(agencyTourId, formData) {
  const res = await apiClient.put(`/agency/tours/manage/${agencyTourId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}