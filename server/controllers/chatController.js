// server/controllers/chatController.js
import {
  getChatAgencies,
  getChatTourists,
  getMyConversations,
  getAgencyConversations,
  createOrGetConversation,
  getConversationById,
  getMessages,
  addMessage,
  markAgencyMessagesRead,
  markTouristMessagesRead,
  deleteMessageForAll,
  deleteConversationForTourist,
  deleteConversationForAgency,
} from "../models/chatModel.js";

function requireRole(req, res, role) {
  const id = req.user?.id;
  const r = req.user?.role;
  if (!id || r !== role) {
    res.status(403).json({ message: `${role[0].toUpperCase() + role.slice(1)} access only.` });
    return null;
  }
  return Number(id);
}

function canAccessConversation(user, convo) {
  const role = user?.role;
  const id = Number(user?.id);
  if (!role || !id) return false;

  if (role === "tourist") return Number(convo.tourist_id) === id;
  if (role === "agency") return Number(convo.agency_id) === id;

  return false;
}

/* Tourist: agencies list */
export async function listChatAgenciesController(req, res) {
  try {
    const search = req.query.search || "";
    const data = await getChatAgencies({ search, limit: 50 });
    res.json({ data });
  } catch (err) {
    console.error("listChatAgenciesController error", err);
    res.status(500).json({ message: "Failed to load agencies." });
  }
}

/* Agency: tourists list */
export async function listChatTouristsController(req, res) {
  try {
    const agencyId = requireRole(req, res, "agency");
    if (!agencyId) return;

    const search = req.query.search || "";
    const data = await getChatTourists({ search, limit: 50 });

    res.json({ data });
  } catch (err) {
    console.error("listChatTouristsController error", err);
    res.status(500).json({ message: "Failed to load tourists." });
  }
}

/* Tourist: my conversations */
export async function getMyConversationsController(req, res) {
  try {
    const userId = requireRole(req, res, "tourist");
    if (!userId) return;

    const rows = await getMyConversations(userId);
    res.json({ data: rows });
  } catch (err) {
    console.error("getMyConversationsController error", err);
    res.status(500).json({ message: "Failed to load conversations." });
  }
}

/* Agency: my conversations */
export async function getAgencyConversationsController(req, res) {
  try {
    const agencyId = requireRole(req, res, "agency");
    if (!agencyId) return;

    const rows = await getAgencyConversations(agencyId);
    res.json({ data: rows });
  } catch (err) {
    console.error("getAgencyConversationsController error", err);
    res.status(500).json({ message: "Failed to load conversations." });
  }
}

/* Tourist: start conversation with agencyId */
export async function startConversationController(req, res) {
  try {
    const userId = requireRole(req, res, "tourist");
    if (!userId) return;

    const { agencyId } = req.body;

    const agencyIdNum = Number(agencyId);
    if (!agencyIdNum) return res.status(400).json({ message: "agencyId is required." });

    const convo = await createOrGetConversation(userId, agencyIdNum);
    res.json({ conversation: convo });
  } catch (err) {
    console.error("startConversationController error", err);
    res.status(500).json({ message: "Failed to start conversation." });
  }
}

/* Agency: start conversation with touristId */
export async function startConversationAsAgencyController(req, res) {
  try {
    const agencyId = requireRole(req, res, "agency");
    if (!agencyId) return;

    const { touristId } = req.body;

    const touristIdNum = Number(touristId);
    if (!touristIdNum) return res.status(400).json({ message: "touristId is required." });

    const convo = await createOrGetConversation(touristIdNum, agencyId);
    res.json({ conversation: convo });
  } catch (err) {
    console.error("startConversationAsAgencyController error", err);
    res.status(500).json({ message: "Failed to start conversation." });
  }
}

/* Tourist: delete conversation */
export async function deleteConversationController(req, res) {
  try {
    const touristId = requireRole(req, res, "tourist");
    if (!touristId) return;

    const onlyIfEmpty = String(req.query.onlyIfEmpty || "") === "1";

    const result = await deleteConversationForTourist({
      conversationId: Number(req.params.conversationId),
      touristId,
      onlyIfEmpty,
    });

    if (!result.ok) {
      if (result.reason === "not_found") return res.status(404).json({ message: "Conversation not found." });
      if (result.reason === "not_allowed") return res.status(403).json({ message: "Not allowed." });
      if (result.reason === "not_empty") return res.status(200).json({ ok: false, reason: "not_empty" });
      return res.status(400).json({ message: "Delete failed." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteConversationController error", err);
    res.status(500).json({ message: "Failed to delete conversation." });
  }
}

/* Agency: delete conversation */
export async function deleteConversationAsAgencyController(req, res) {
  try {
    const agencyId = requireRole(req, res, "agency");
    if (!agencyId) return;

    const onlyIfEmpty = String(req.query.onlyIfEmpty || "") === "1";

    const result = await deleteConversationForAgency({
      conversationId: Number(req.params.conversationId),
      agencyId,
      onlyIfEmpty,
    });

    if (!result.ok) {
      if (result.reason === "not_found") return res.status(404).json({ message: "Conversation not found." });
      if (result.reason === "not_allowed") return res.status(403).json({ message: "Not allowed." });
      if (result.reason === "not_empty") return res.status(200).json({ ok: false, reason: "not_empty" });
      return res.status(400).json({ message: "Delete failed." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteConversationAsAgencyController error", err);
    res.status(500).json({ message: "Failed to delete conversation." });
  }
}

/* Details */
export async function getConversationDetailsController(req, res) {
  try {
    const user = req.user;
    const convo = await getConversationById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (!canAccessConversation(user, convo)) return res.status(403).json({ message: "Not allowed." });

    res.json({ conversation: convo });
  } catch (err) {
    console.error("getConversationDetailsController error", err);
    res.status(500).json({ message: "Failed to load conversation." });
  }
}

/* Messages */
export async function getMessagesController(req, res) {
  try {
    const user = req.user;
    const convo = await getConversationById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (!canAccessConversation(user, convo)) return res.status(403).json({ message: "Not allowed." });

    const result = await getMessages(req.params.conversationId, req.query);
    res.json(result);
  } catch (err) {
    console.error("getMessagesController error", err);
    res.status(500).json({ message: "Failed to load messages." });
  }
}

/* Send message */
export async function postMessageController(req, res) {
  try {
    const user = req.user;
    const convo = await getConversationById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (!canAccessConversation(user, convo)) return res.status(403).json({ message: "Not allowed." });

    const text = String(req.body?.message || "").trim();
    if (!text) return res.status(400).json({ message: "Message is required." });

    const row = await addMessage(req.params.conversationId, {
      senderId: user.id,
      senderRole: user.role,
      message: text,
    });

    res.json({ message: row });
  } catch (err) {
    console.error("postMessageController error", err);
    res.status(500).json({ message: "Failed to send message." });
  }
}

/* Mark read */
export async function markReadController(req, res) {
  try {
    const user = req.user;
    const convo = await getConversationById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (!canAccessConversation(user, convo)) return res.status(403).json({ message: "Not allowed." });

    if (user.role === "tourist") {
      await markAgencyMessagesRead(req.params.conversationId);
    } else if (user.role === "agency") {
      await markTouristMessagesRead(req.params.conversationId);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("markReadController error", err);
    res.status(500).json({ message: "Failed to mark read." });
  }
}

/* Delete message for all */
export async function deleteMessageController(req, res) {
  try {
    const user = req.user;
    const convo = await getConversationById(req.params.conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (!canAccessConversation(user, convo)) return res.status(403).json({ message: "Not allowed." });

    const result = await deleteMessageForAll(
      req.params.conversationId,
      req.params.messageId,
      user.id,
      user.role
    );

    if (!result.ok) {
      if (result.reason === "not_found") return res.status(404).json({ message: "Message not found." });
      if (result.reason === "not_allowed") return res.status(403).json({ message: "You can only delete your own message." });
      return res.status(400).json({ message: "Delete failed." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteMessageController error", err);
    res.status(500).json({ message: "Failed to delete message." });
  }
}
