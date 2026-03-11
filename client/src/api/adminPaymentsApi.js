// client/src/api/adminPaymentsApi.js
import apiClient from "./apiClient";

export async function getAdminPayments() {
  const res = await apiClient.get("/admin/payments");
  return res.data;
}

export async function getAdminPaymentById(paymentId) {
  const res = await apiClient.get(`/admin/payments/${paymentId}`);
  return res.data;
}