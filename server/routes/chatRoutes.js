import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  listChatAgenciesController,
  getMyConversationsController,
  startConversationController,
  deleteConversationController,
  getConversationDetailsController,
  getMessagesController,
  postMessageController,
  markReadController,
  deleteMessageController,
} from "../controllers/chatController.js";

const router = express.Router();

// Agencies list for "Start New Chat"
router.get("/agencies", authRequired, listChatAgenciesController);

// Tourist: list conversations
router.get("/conversations", authRequired, getMyConversationsController);

// Tourist: start new chat (agencyId)
router.post("/conversations", authRequired, startConversationController);

// ✅ Delete whole conversation (Messenger-style)
// optional query: ?onlyIfEmpty=1
router.delete("/conversations/:conversationId", authRequired, deleteConversationController);

// Delete message for all (soft delete)
router.delete(
  "/conversations/:conversationId/messages/:messageId",
  authRequired,
  deleteMessageController
);

// Details
router.get(
  "/conversations/:conversationId",
  authRequired,
  getConversationDetailsController
);

// Messages (pagination)
router.get(
  "/conversations/:conversationId/messages",
  authRequired,
  getMessagesController
);

// Send message
router.post(
  "/conversations/:conversationId/messages",
  authRequired,
  postMessageController
);

// Mark read
router.post(
  "/conversations/:conversationId/read",
  authRequired,
  markReadController
);

export default router;
