import apiClient from "./apiClient";

export async function fetchPublicBlogs(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page) searchParams.set("page", params.page);
  if (params.limit) searchParams.set("limit", params.limit);

  const queryString = searchParams.toString();
  const url = queryString ? `/public/blogs?${queryString}` : `/public/blogs`;

  const res = await apiClient.get(url);
  return res.data;
}

export async function fetchPublicBlogDetails(blogId) {
  const res = await apiClient.get(`/public/blogs/${blogId}`);
  return res.data;
}

export async function fetchBlogComments(blogId, params = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.limit) searchParams.set("limit", params.limit);

  const qs = searchParams.toString();
  const url = qs ? `/blogs/${blogId}/comments?${qs}` : `/blogs/${blogId}/comments`;

  const res = await apiClient.get(url);
  return res.data; // { comments, pagination }
}

export async function postBlogComment(blogId, comment, token) {
  const res = await apiClient.post(
    `/blogs/${blogId}/comments`,
    { comment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function deleteBlogComment(blogId, commentId, token) {
  const res = await apiClient.delete(`/blogs/${blogId}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
