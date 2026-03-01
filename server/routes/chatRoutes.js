// server/routes/chatRoutes.js
import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import {
  listChatAgenciesController,
  listChatTouristsController,
  getMyConversationsController,
  getAgencyConversationsController,
  startConversationController,
  startConversationAsAgencyController,
  deleteConversationController,
  deleteConversationAsAgencyController,
  getConversationDetailsController,
  getMessagesController,
  postMessageController,
  markReadController,
  deleteMessageController,
} from "../controllers/chatController.js";

const router = express.Router();

/* Tourist: Agencies list for "Start New Chat" */
router.get("/agencies", authRequired, listChatAgenciesController);

/* Agency: Tourists list for "Start New Chat" */
router.get("/tourists", authRequired, listChatTouristsController);

/* Tourist: list conversations */
router.get("/conversations", authRequired, getMyConversationsController);

/* Agency: list conversations */
router.get("/agency/conversations", authRequired, getAgencyConversationsController);

/* Tourist: start new chat (agencyId) */
router.post("/conversations", authRequired, startConversationController);

/* Agency: start new chat (touristId) */
router.post("/agency/conversations", authRequired, startConversationAsAgencyController);

/* Tourist: delete whole conversation (optional query: ?onlyIfEmpty=1) */
router.delete("/conversations/:conversationId", authRequired, deleteConversationController);

/* Agency: delete whole conversation (optional query: ?onlyIfEmpty=1) */
router.delete(
  "/agency/conversations/:conversationId",
  authRequired,
  deleteConversationAsAgencyController
);

/* Delete message for all (soft delete) */
router.delete(
  "/conversations/:conversationId/messages/:messageId",
  authRequired,
  deleteMessageController
);

/* Details */
router.get("/conversations/:conversationId", authRequired, getConversationDetailsController);

/* Messages (pagination) */
router.get(
  "/conversations/:conversationId/messages",
  authRequired,
  getMessagesController
);

/* Send message */
router.post(
  "/conversations/:conversationId/messages",
  authRequired,
  postMessageController
);

/* Mark read */
router.post(
  "/conversations/:conversationId/read",
  authRequired,
  markReadController
);

export default router;
