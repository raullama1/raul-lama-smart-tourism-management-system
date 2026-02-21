// server/controllers/chatController.js
import {
  getChatAgencies,
  getMyConversations,
  createOrGetConversation,
  getConversationById,
  getMessages,
  addMessage,
  markAgencyMessagesRead,
  deleteMessageForAll,
  deleteConversationForTourist,
} from "../models/chatModel.js";

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

export async function getMyConversationsController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role !== "tourist") {
      return res.status(403).json({ message: "Tourist access only." });
    }

    const rows = await getMyConversations(userId);
    res.json({ data: rows });
  } catch (err) {
    console.error("getMyConversationsController error", err);
    res.status(500).json({ message: "Failed to load conversations." });
  }
}

export async function startConversationController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { agencyId } = req.body;

    if (role !== "tourist") {
      return res.status(403).json({ message: "Tourist access only." });
    }

    const agencyIdNum = Number(agencyId);
    if (!agencyIdNum) {
      return res.status(400).json({ message: "agencyId is required." });
    }

    const convo = await createOrGetConversation(userId, agencyIdNum);
    res.json({ conversation: convo });
  } catch (err) {
    console.error("startConversationController error", err);
    res.status(500).json({ message: "Failed to start conversation." });
  }
}

export async function deleteConversationController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { conversationId } = req.params;

    if (role !== "tourist") {
      return res.status(403).json({ message: "Tourist access only." });
    }

    const onlyIfEmpty = String(req.query.onlyIfEmpty || "") === "1";

    const result = await deleteConversationForTourist({
      conversationId: Number(conversationId),
      touristId: Number(userId),
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

export async function getConversationDetailsController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { conversationId } = req.params;

    const convo = await getConversationById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (role === "tourist" && Number(convo.tourist_id) !== Number(userId)) {
      return res.status(403).json({ message: "Not allowed." });
    }

    res.json({ conversation: convo });
  } catch (err) {
    console.error("getConversationDetailsController error", err);
    res.status(500).json({ message: "Failed to load conversation." });
  }
}

export async function getMessagesController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { conversationId } = req.params;

    const convo = await getConversationById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (role === "tourist" && Number(convo.tourist_id) !== Number(userId)) {
      return res.status(403).json({ message: "Not allowed." });
    }

    const result = await getMessages(conversationId, req.query);
    res.json(result);
  } catch (err) {
    console.error("getMessagesController error", err);
    res.status(500).json({ message: "Failed to load messages." });
  }
}

export async function postMessageController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { conversationId } = req.params;
    const { message } = req.body;

    const convo = await getConversationById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (role === "tourist" && Number(convo.tourist_id) !== Number(userId)) {
      return res.status(403).json({ message: "Not allowed." });
    }

    const text = String(message || "").trim();
    if (!text) return res.status(400).json({ message: "Message is required." });

    const row = await addMessage(conversationId, {
      senderId: userId,
      senderRole: role,
      message: text,
    });

    res.json({ message: row });
  } catch (err) {
    console.error("postMessageController error", err);
    res.status(500).json({ message: "Failed to send message." });
  }
}

export async function markReadController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { conversationId } = req.params;

    const convo = await getConversationById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (role === "tourist" && Number(convo.tourist_id) !== Number(userId)) {
      return res.status(403).json({ message: "Not allowed." });
    }

    await markAgencyMessagesRead(conversationId);
    res.json({ ok: true });
  } catch (err) {
    console.error("markReadController error", err);
    res.status(500).json({ message: "Failed to mark read." });
  }
}

export async function deleteMessageController(req, res) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { conversationId, messageId } = req.params;

    const convo = await getConversationById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    if (role === "tourist" && Number(convo.tourist_id) !== Number(userId)) {
      return res.status(403).json({ message: "Not allowed." });
    }

    const result = await deleteMessageForAll(conversationId, messageId, userId, role);

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
