import apiClient from "./apiClient";

export const fetchMyBookings = async (token, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await apiClient.get(`/bookings?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { data: [...] }
};

export const payBooking = async (token, bookingId) => {
  const res = await apiClient.post(
    `/bookings/${bookingId}/pay`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const cancelBooking = async (token, bookingId) => {
  const res = await apiClient.post(
    `/bookings/${bookingId}/cancel`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
