// client/src/api/chatApi.js
import apiClient from "./apiClient";

export async function fetchMyConversations(token) {
  const res = await apiClient.get("/chat/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { data: [...] }
}

export async function startConversation(token, agencyId) {
  const res = await apiClient.post(
    "/chat/conversations",
    { agencyId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // { conversation }
}

export async function fetchChatAgencies(token, params = {}) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);

  const qs = sp.toString();
  const url = qs ? `/chat/agencies?${qs}` : `/chat/agencies`;

  const res = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { data: [...] }
}

export async function fetchConversation(token, conversationId) {
  const res = await apiClient.get(`/chat/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { conversation }
}

export async function fetchMessages(token, conversationId, params = {}) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));

  const qs = sp.toString();
  const url = qs
    ? `/chat/conversations/${conversationId}/messages?${qs}`
    : `/chat/conversations/${conversationId}/messages`;

  const res = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { messages, pagination }
}

export async function sendMessage(token, conversationId, message) {
  const res = await apiClient.post(
    `/chat/conversations/${conversationId}/messages`,
    { message },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // { message }
}

export async function markRead(token, conversationId) {
  const res = await apiClient.post(
    `/chat/conversations/${conversationId}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // { ok: true }
}

export async function deleteMessage(token, conversationId, messageId) {
  const res = await apiClient.delete(
    `/chat/conversations/${conversationId}/messages/${messageId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; // { ok: true }
}

/**
 * Delete a whole conversation (Messenger-style).
 * If onlyIfEmpty=true, backend deletes ONLY when it has 0 messages.
 */
export async function deleteConversation(token, conversationId, { onlyIfEmpty = false } = {}) {
  const sp = new URLSearchParams();
  if (onlyIfEmpty) sp.set("onlyIfEmpty", "1");

  const qs = sp.toString();
  const url = qs
    ? `/chat/conversations/${conversationId}?${qs}`
    : `/chat/conversations/${conversationId}`;

  const res = await apiClient.delete(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data; // { ok: true } OR { ok:false, reason:"not_empty" }
}
