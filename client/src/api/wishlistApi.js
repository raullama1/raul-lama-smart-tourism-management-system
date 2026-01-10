import apiClient from "./apiClient";

// ==========================
// Get all wishlist tour IDs
// ==========================
export const fetchWishlistIds = async (token) => {
  const res = await apiClient.get("/wishlist/ids", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data; // { ids: [1,2,3] }
};

// ==========================
// Get full wishlist tours
// ==========================
export const fetchWishlist = async (token) => {
  const res = await apiClient.get("/wishlist", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data; // { data: [...] }
};

// ==========================
// Add to wishlist
// ==========================
export const addToWishlist = async (token, tourId) => {
  const res = await apiClient.post(
    `/wishlist/${tourId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

// ==========================
// Remove from wishlist
// ==========================
export const removeFromWishlist = async (token, tourId) => {
  const res = await apiClient.delete(`/wishlist/${tourId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
