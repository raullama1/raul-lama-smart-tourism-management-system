// client/src/api/agencyBookingsApi.js
import apiClient from "./apiClient";

export async function fetchAgencyBookings(params = {}) {
  const sp = new URLSearchParams(params);
  const query = sp.toString();
  const url = query ? `/agency/bookings?${query}` : `/agency/bookings`;
  const res = await apiClient.get(url);
  return res.data; // { data: [...] }
}

export async function approveAgencyBooking(bookingId) {
  const res = await apiClient.patch(`/agency/bookings/${bookingId}/approve`);
  return res.data;
}

export async function rejectAgencyBooking(bookingId) {
  const res = await apiClient.patch(`/agency/bookings/${bookingId}/reject`);
  return res.data;
}