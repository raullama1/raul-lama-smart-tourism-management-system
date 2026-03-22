// client/src/api/paymentApi.js
import apiClient from "./apiClient";

export const initiateEsewaPayment = async (bookingId) => {
  const res = await apiClient.post("/payments/esewa/initiate", { bookingId });
  return res.data;
};