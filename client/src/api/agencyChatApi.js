// client/src/api/agencyChatApi.js
import apiClient from "./apiClient";

export async function fetchAgencyConversations(token) {
  const res = await apiClient.get("/chat/agency/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { data: [...] }
}

export async function startAgencyConversation(token, touristId) {
  const res = await apiClient.post(
    "/chat/agency/conversations",
    { touristId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // { conversation }
}

export async function fetchChatTourists(token, params = {}) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);

  const qs = sp.toString();
  const url = qs ? `/chat/tourists?${qs}` : `/chat/tourists`;

  const res = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data; // { data: [...] }
}

/**
 * Agency delete whole conversation (Messenger-style).
 * If onlyIfEmpty=true, backend deletes ONLY when it has 0 messages.
 */
export async function deleteAgencyConversation(token, conversationId, { onlyIfEmpty = false } = {}) {
  const sp = new URLSearchParams();
  if (onlyIfEmpty) sp.set("onlyIfEmpty", "1");

  const qs = sp.toString();
  const url = qs
    ? `/chat/agency/conversations/${conversationId}?${qs}`
    : `/chat/agency/conversations/${conversationId}`;

  const res = await apiClient.delete(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data; // { ok: true } OR { ok:false, reason:"not_empty" }
}