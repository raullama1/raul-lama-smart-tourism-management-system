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