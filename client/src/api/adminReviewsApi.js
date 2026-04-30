// client/src/api/adminReviewsApi.js
import apiClient from "./apiClient";

export async function fetchAgencyReviews(params = {}, token) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);

  if (
    params.rating &&
    String(params.rating).toLowerCase() !== "any" &&
    String(params.rating).toLowerCase() !== "all"
  ) {
    searchParams.set("rating", String(params.rating));
  }

  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const url = qs ? `/agency/reviews?${qs}` : `/agency/reviews`;

  const res = await apiClient.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}