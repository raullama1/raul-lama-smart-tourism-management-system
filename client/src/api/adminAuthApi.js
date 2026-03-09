// client/src/api/adminAuthApi.js
import apiClient from "./apiClient";

export async function adminLogin(identifier, password) {
  const { data } = await apiClient.post("/admin/auth/login", {
    identifier,
    password,
  });
  return data;
}

export async function adminMe(token) {
  const { data } = await apiClient.get("/admin/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}