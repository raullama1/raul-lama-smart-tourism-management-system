// client/src/api/agencyBlogsApi.js
import apiClient from "./apiClient";

export async function createAgencyBlog(formData, token) {
  const res = await apiClient.post("/agency/blogs", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function fetchAgencyBlogs(params = {}, token) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const url = qs ? `/agency/blogs?${qs}` : `/agency/blogs`;

  const res = await apiClient.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export async function updateAgencyBlog(blogId, formData, token) {
  const res = await apiClient.put(`/agency/blogs/${blogId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function deleteAgencyBlog(blogId, token) {
  const res = await apiClient.delete(`/agency/blogs/${blogId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}