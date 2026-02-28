// client/src/api/bookingApi.js
import apiClient from "./apiClient";

export const fetchMyBookings = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = params ? `/bookings?${params}` : "/bookings";
  const res = await apiClient.get(url);
  return res.data; // { data: [...] }
};

export const payBooking = async (bookingId) => {
  const res = await apiClient.post(`/bookings/${bookingId}/pay`, {});
  return res.data;
};

export const cancelBooking = async (bookingId) => {
  const res = await apiClient.post(`/bookings/${bookingId}/cancel`, {});
  return res.data;
};

export const fetchBookingPreview = async (agencyTourId) => {
  const res = await apiClient.get(`/bookings/preview/${agencyTourId}`);
  return res.data; // { data: { tour_title, agency_name, price, ... } }
};

export const createBooking = async (payload) => {
  const res = await apiClient.post(`/bookings`, payload);
  return res.data; // { message, data }
};
