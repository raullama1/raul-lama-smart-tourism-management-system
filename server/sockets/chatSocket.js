// server/sockets/chatSocket.js
import jwt from "jsonwebtoken";
import {
  getConversationById,
  addMessage,
  markAgencyMessagesRead,
  deleteMessageForAll,
} from "../models/chatModel.js";

import {
  createNotification,
} from "../models/notificationModel.js";

function getUserFromToken(token) {
  try {
    if (!token) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function safeText(input, max = 90) {
  const s = String(input || "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function initChatSocket(io) {
  io.on("connection", (socket) => {
    const token = socket.handshake?.auth?.token;
    const user = getUserFromToken(token);

    if (!user?.id || !user?.role) {
      socket.emit("auth_error", { message: "Unauthorized socket." });
      socket.disconnect(true);
      return;
    }

    socket.user = user;

    // Default join for direct user notifications
    socket.join(`user:${user.id}`);

    const displayName =
      user.name || (user.role === "agency" ? "Agency" : "Tourist");

    // Client emits this on connect as well; safe to keep.
    socket.on("user:join", () => {
      socket.join(`user:${user.id}`);
    });

    socket.on("chat:join", async ({ conversationId }) => {
      try {
        const convo = await getConversationById(conversationId);
        if (!convo) return;

        if (user.role === "tourist" && Number(convo.tourist_id) !== Number(user.id)) return;

        socket.join(`convo:${conversationId}`);

        if (user.role === "tourist") {
          await markAgencyMessagesRead(conversationId);
          io.to(`convo:${conversationId}`).emit("chat:read", {
            conversationId,
            byRole: "tourist",
            at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("chat:join error", e);
      }
    });

    socket.on("chat:leave", ({ conversationId }) => {
      socket.leave(`convo:${conversationId}`);
    });

    socket.on("chat:typing", async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const convo = await getConversationById(conversationId);
        if (!convo) return;

        if (user.role === "tourist" && Number(convo.tourist_id) !== Number(user.id)) return;

        socket.to(`convo:${conversationId}`).emit("chat:typing", {
          conversationId,
          name: displayName,
        });
      } catch (e) {
        console.error("chat:typing error", e);
      }
    });

    socket.on("chat:stopTyping", async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const convo = await getConversationById(conversationId);
        if (!convo) return;

        if (user.role === "tourist" && Number(convo.tourist_id) !== Number(user.id)) return;

        socket.to(`convo:${conversationId}`).emit("chat:stopTyping", { conversationId });
      } catch (e) {
        console.error("chat:stopTyping error", e);
      }
    });

    socket.on("chat:send", async ({ conversationId, message }, ack) => {
      try {
        const text = String(message || "").trim();
        if (!text) return ack?.({ ok: false, message: "Empty message." });

        const convo = await getConversationById(conversationId);
        if (!convo) return ack?.({ ok: false, message: "Conversation not found." });

        if (user.role === "tourist" && Number(convo.tourist_id) !== Number(user.id)) {
          return ack?.({ ok: false, message: "Not allowed." });
        }

        const saved = await addMessage(conversationId, {
          senderId: user.id,
          senderRole: user.role,
          message: text,
        });

        io.to(`convo:${conversationId}`).emit("chat:message", {
          conversationId,
          message: saved,
        });

        // Create notification for the other side
        const receiverId =
          user.role === "tourist" ? Number(convo.agency_id) : Number(convo.tourist_id);

        const notifTitle =
          user.role === "tourist"
            ? "New message from Tourist"
            : "New message from Agency";

        const notifBody = safeText(text);

        // Store in DB and emit in realtime
        try {
          const created = await createNotification({
            userId: receiverId,
            type: "chat",
            title: notifTitle,
            message: notifBody,
            meta: JSON.stringify({
              conversationId: Number(conversationId),
              senderRole: user.role,
            }),
          });

          io.to(`user:${receiverId}`).emit("notification:new", created);
        } catch (e) {
          console.error("createNotification(chat) error", e);
        }

        ack?.({ ok: true, message: saved });
      } catch (e) {
        console.error("chat:send error", e);
        ack?.({ ok: false, message: "Send failed." });
      }
    });

    socket.on("chat:markRead", async ({ conversationId }) => {
      try {
        const convo = await getConversationById(conversationId);
        if (!convo) return;

        if (user.role === "tourist" && Number(convo.tourist_id) !== Number(user.id)) return;

        if (user.role === "tourist") {
          await markAgencyMessagesRead(conversationId);
          io.to(`convo:${conversationId}`).emit("chat:read", {
            conversationId,
            byRole: "tourist",
            at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("chat:markRead error", e);
      }
    });

    socket.on("chat:delete", async ({ conversationId, messageId }, ack) => {
      try {
        if (!conversationId || !messageId) {
          return ack?.({ ok: false, message: "Missing params." });
        }

        const convo = await getConversationById(conversationId);
        if (!convo) return ack?.({ ok: false, message: "Conversation not found." });

        if (user.role === "tourist" && Number(convo.tourist_id) !== Number(user.id)) {
          return ack?.({ ok: false, message: "Not allowed." });
        }

        const result = await deleteMessageForAll(conversationId, messageId, user.id, user.role);
        if (!result.ok) {
          const msg =
            result.reason === "not_allowed"
              ? "You can only delete your own message."
              : "Delete failed.";
          return ack?.({ ok: false, message: msg });
        }

        io.to(`convo:${conversationId}`).emit("chat:deleted", {
          conversationId,
          messageId,
          by: user.role,
          at: new Date().toISOString(),
        });

        ack?.({ ok: true });
      } catch (e) {
        console.error("chat:delete error", e);
        ack?.({ ok: false, message: "Delete failed." });
      }
    });
  });
}
