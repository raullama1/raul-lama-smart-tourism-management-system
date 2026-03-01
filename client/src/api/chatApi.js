// client/src/api/chatApi.js
import apiClient from "./apiClient";

/**
 * Internal helper to attach Authorization header
 */
function authHeader(token) {
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
}

/* =========================================================
   TOURIST CHAT APIs
   ========================================================= */

/**
 * Fetch logged-in tourist conversations
 */
export async function fetchMyConversations(token) {
  const res = await apiClient.get(
    "/chat/conversations",
    authHeader(token)
  );
  return res.data; // { data: [...] }
}

/**
 * Start new conversation with agency (Tourist side)
 */
export async function startConversation(token, agencyId) {
  const res = await apiClient.post(
    "/chat/conversations",
    { agencyId },
    authHeader(token)
  );
  return res.data; // { conversation }
}

/**
 * List agencies for "Start New Chat" (Tourist side)
 */
export async function fetchChatAgencies(token, params = {}) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);

  const qs = sp.toString();
  const url = qs ? `/chat/agencies?${qs}` : `/chat/agencies`;

  const res = await apiClient.get(url, authHeader(token));
  return res.data; // { data: [...] }
}

/**
 * Fetch single conversation details
 */
export async function fetchConversation(token, conversationId) {
  const res = await apiClient.get(
    `/chat/conversations/${conversationId}`,
    authHeader(token)
  );
  return res.data; // { conversation }
}

/**
 * Fetch messages with pagination
 */
export async function fetchMessages(token, conversationId, params = {}) {
  const sp = new URLSearchParams();

  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));

  const qs = sp.toString();
  const url = qs
    ? `/chat/conversations/${conversationId}/messages?${qs}`
    : `/chat/conversations/${conversationId}/messages`;

  const res = await apiClient.get(url, authHeader(token));
  return res.data; // { messages, pagination }
}

/**
 * Send message in conversation
 */
export async function sendMessage(token, conversationId, message) {
  const res = await apiClient.post(
    `/chat/conversations/${conversationId}/messages`,
    { message },
    authHeader(token)
  );
  return res.data; // { message }
}

/**
 * Mark conversation messages as read
 */
export async function markRead(token, conversationId) {
  const res = await apiClient.post(
    `/chat/conversations/${conversationId}/read`,
    {},
    authHeader(token)
  );
  return res.data; // { ok: true }
}

/**
 * Delete a single message
 */
export async function deleteMessage(token, conversationId, messageId) {
  const res = await apiClient.delete(
    `/chat/conversations/${conversationId}/messages/${messageId}`,
    authHeader(token)
  );
  return res.data; // { ok: true }
}

/**
 * Delete conversation (Tourist side)
 * If onlyIfEmpty=true, backend deletes only when it has 0 messages.
 */
export async function deleteConversation(
  token,
  conversationId,
  { onlyIfEmpty = false } = {}
) {
  const sp = new URLSearchParams();
  if (onlyIfEmpty) sp.set("onlyIfEmpty", "1");

  const qs = sp.toString();
  const url = qs
    ? `/chat/conversations/${conversationId}?${qs}`
    : `/chat/conversations/${conversationId}`;

  const res = await apiClient.delete(url, authHeader(token));
  return res.data; // { ok:true } OR { ok:false, reason:"not_empty" }
}

/* =========================================================
   AGENCY CHAT APIs
   ========================================================= */

/**
 * Fetch logged-in agency conversations
 */
export async function fetchAgencyConversations(token) {
  const res = await apiClient.get(
    "/chat/agency/conversations",
    authHeader(token)
  );
  return res.data; // { data: [...] }
}

/**
 * List tourists for "Start New Chat" (Agency side)
 */
export async function fetchChatTourists(token, params = {}) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);

  const qs = sp.toString();
  const url = qs ? `/chat/tourists?${qs}` : `/chat/tourists`;

  const res = await apiClient.get(url, authHeader(token));
  return res.data; // { data: [...] }
}

/**
 * Start conversation with tourist (Agency side)
 */
export async function startConversationAsAgency(token, touristId) {
  const res = await apiClient.post(
    "/chat/agency/conversations",
    { touristId },
    authHeader(token)
  );
  return res.data; // { conversation }
}

/**
 * Delete conversation (Agency side)
 */
export async function deleteConversationAsAgency(
  token,
  conversationId,
  { onlyIfEmpty = false } = {}
) {
  const sp = new URLSearchParams();
  if (onlyIfEmpty) sp.set("onlyIfEmpty", "1");

  const qs = sp.toString();
  const url = qs
    ? `/chat/agency/conversations/${conversationId}?${qs}`
    : `/chat/agency/conversations/${conversationId}`;

  const res = await apiClient.delete(url, authHeader(token));
  return res.data; // { ok:true } OR { ok:false, reason:"not_empty" }
}