// client/src/api/agencyEarningsApi.js
import apiClient from "./apiClient";

export async function fetchAgencyEarnings(params = {}, token) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const url = qs ? `/agency/earnings?${qs}` : `/agency/earnings`;

  const res = await apiClient.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}