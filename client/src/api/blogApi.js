// client/src/api/blogApi.js
import apiClient from "./apiClient";

// GET /api/public/blogs   (from client POV: /public/blogs)
export async function fetchPublicBlogs(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page) searchParams.set("page", params.page);
  if (params.limit) searchParams.set("limit", params.limit);

  const queryString = searchParams.toString();
  const url = queryString
    ? `/public/blogs?${queryString}`
    : `/public/blogs`;

  const res = await apiClient.get(url);
  return res.data; // { data, pagination }
}

// GET /api/public/blogs/:blogId   (from client POV: /public/blogs/:blogId)
export async function fetchPublicBlogDetails(blogId) {
  const res = await apiClient.get(`/public/blogs/${blogId}`);
  // { blog, recentBlogs }
  return res.data;
}
