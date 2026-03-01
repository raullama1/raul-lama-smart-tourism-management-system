// server/sockets/chatSocket.js
import jwt from "jsonwebtoken";
import {
  getConversationById,
  addMessage,
  markAgencyMessagesRead,
  markTouristMessagesRead,
  deleteMessageForAll,
} from "../models/chatModel.js";
import { createNotification } from "../models/notificationModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function getUserFromToken(token) {
  try {
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function safeText(input, max = 90) {
  const s = String(input || "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function canAccessConversation(user, convo) {
  const role = user?.role;
  const id = Number(user?.id);
  if (!role || !id) return false;

  if (role === "tourist") return Number(convo.tourist_id) === id;
  if (role === "agency") return Number(convo.agency_id) === id;

  return false;
}

/**
 * Namespaced account rooms prevent ID collision (tourist 5 vs agency 5).
 * Example: acct:tourist:5, acct:agency:5
 */
function acctRoom(role, id) {
  return `acct:${role}:${Number(id)}`;
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

    // Personal rooms: used for real-time sidebar updates even when no convo is open.
    socket.join(acctRoom(user.role, user.id));

    // Kept for backwards compatibility with existing notification code paths.
    socket.join(`user:${user.id}`);

    const displayName = user.name || (user.role === "agency" ? "Agency" : "Tourist");

    socket.on("user:join", () => {
      socket.join(acctRoom(user.role, user.id));
      socket.join(`user:${user.id}`);
    });

    socket.on("chat:join", async ({ conversationId }) => {
      try {
        const convo = await getConversationById(conversationId);
        if (!convo) return;
        if (!canAccessConversation(user, convo)) return;

        socket.join(`convo:${conversationId}`);

        // Persist read-state on join.
        if (user.role === "tourist") await markAgencyMessagesRead(conversationId);
        if (user.role === "agency") await markTouristMessagesRead(conversationId);

        const payload = {
          conversationId,
          byRole: user.role,
          at: new Date().toISOString(),
        };

        // Send to the other participant if they are currently in the convo room.
        socket.to(`convo:${conversationId}`).emit("chat:read", payload);

        // Sidebar unread updates for both sides (exclude current socket for sender side).
        const touristRoom = acctRoom("tourist", convo.tourist_id);
        const agencyRoom = acctRoom("agency", convo.agency_id);

        socket.to(touristRoom).emit("chat:read", payload);
        socket.to(agencyRoom).emit("chat:read", payload);
        io.to(user.role === "tourist" ? agencyRoom : touristRoom).emit("chat:read", payload);
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
        if (!canAccessConversation(user, convo)) return;

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
        if (!canAccessConversation(user, convo)) return;

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
        if (!canAccessConversation(user, convo)) return ack?.({ ok: false, message: "Not allowed." });

        const saved = await addMessage(conversationId, {
          senderId: user.id,
          senderRole: user.role,
          message: text,
        });

        const payload = { conversationId, message: saved };

        const touristRoom = acctRoom("tourist", convo.tourist_id);
        const agencyRoom = acctRoom("agency", convo.agency_id);

        // Do not echo the message back to the same socket (prevents duplicates).
        // 1) Deliver to the other participant if they have the chat open.
        socket.to(`convo:${conversationId}`).emit("chat:message", payload);

        // 2) Deliver to the other participant’s sidebar (even if they do not have chat open).
        io.to(user.role === "tourist" ? agencyRoom : touristRoom).emit("chat:message", payload);

        // 3) Deliver to sender’s other tabs/devices for sidebar updates (exclude current socket).
        socket.to(acctRoom(user.role, user.id)).emit("chat:message", payload);

        // Acknowledge sender so client can replace optimistic temp message.
        ack?.({ ok: true, message: saved });

        // Optional notifications (may fail if receiver is not in users table).
        const receiverId =
          user.role === "tourist" ? Number(convo.agency_id) : Number(convo.tourist_id);

        const notifTitle =
          user.role === "tourist" ? "New message from Tourist" : "New message from Agency";
        const notifBody = safeText(text);

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
      } catch (e) {
        console.error("chat:send error", e);
        ack?.({ ok: false, message: "Send failed." });
      }
    });

    socket.on("chat:markRead", async ({ conversationId }) => {
      try {
        const convo = await getConversationById(conversationId);
        if (!convo) return;
        if (!canAccessConversation(user, convo)) return;

        if (user.role === "tourist") await markAgencyMessagesRead(conversationId);
        if (user.role === "agency") await markTouristMessagesRead(conversationId);

        const payload = {
          conversationId,
          byRole: user.role,
          at: new Date().toISOString(),
        };

        const touristRoom = acctRoom("tourist", convo.tourist_id);
        const agencyRoom = acctRoom("agency", convo.agency_id);

        socket.to(`convo:${conversationId}`).emit("chat:read", payload);
        io.to(user.role === "tourist" ? agencyRoom : touristRoom).emit("chat:read", payload);
        socket.to(acctRoom(user.role, user.id)).emit("chat:read", payload);
      } catch (e) {
        console.error("chat:markRead error", e);
      }
    });

    socket.on("chat:delete", async ({ conversationId, messageId }, ack) => {
      try {
        if (!conversationId || !messageId) return ack?.({ ok: false, message: "Missing params." });

        const convo = await getConversationById(conversationId);
        if (!convo) return ack?.({ ok: false, message: "Conversation not found." });
        if (!canAccessConversation(user, convo)) return ack?.({ ok: false, message: "Not allowed." });

        const result = await deleteMessageForAll(conversationId, messageId, user.id, user.role);

        if (!result.ok) {
          const msg =
            result.reason === "not_allowed"
              ? "You can only delete your own message."
              : "Delete failed.";
          return ack?.({ ok: false, message: msg });
        }

        const payload = {
          conversationId,
          messageId,
          by: user.role,
          at: new Date().toISOString(),
        };

        const touristRoom = acctRoom("tourist", convo.tourist_id);
        const agencyRoom = acctRoom("agency", convo.agency_id);

        socket.to(`convo:${conversationId}`).emit("chat:deleted", payload);
        io.to(user.role === "tourist" ? agencyRoom : touristRoom).emit("chat:deleted", payload);
        socket.to(acctRoom(user.role, user.id)).emit("chat:deleted", payload);

        ack?.({ ok: true });
      } catch (e) {
        console.error("chat:delete error", e);
        ack?.({ ok: false, message: "Delete failed." });
      }
    });
  });
}
