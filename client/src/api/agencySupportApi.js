// client/src/api/agencySupportApi.js
import apiClient from "./apiClient";

export async function createAgencySupportTicket(payload) {
  const res = await apiClient.post("/agency/support/tickets", payload);
  return res.data;
}
