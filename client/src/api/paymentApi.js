// client/src/api/paymentApi.js
import apiClient from "./apiClient";

// Start eSewa payment (server returns { esewaUrl, formData })
export const initiateEsewaPayment = async (bookingId) => {
  const res = await apiClient.post("/payments/esewa/initiate", { bookingId });
  return res.data; // { data: { esewaUrl, formData } }
};
