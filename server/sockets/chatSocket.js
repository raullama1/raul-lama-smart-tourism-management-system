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

function isConversationVisibleToUser(user, convo) {
  if (!canAccessConversation(user, convo)) return false;

  if (user?.role === "tourist") {
    return Number(convo?.deleted_for_tourist || 0) === 0;
  }

  if (user?.role === "agency") {
    return Number(convo?.deleted_for_agency || 0) === 0;
  }

  return false;
}

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

    socket.join(acctRoom(user.role, user.id));
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
        if (!isConversationVisibleToUser(user, convo)) return;

        socket.join(`convo:${conversationId}`);

        if (user.role === "tourist") {
          await markAgencyMessagesRead(conversationId);
        }

        if (user.role === "agency") {
          await markTouristMessagesRead(conversationId);
        }

        const payload = {
          conversationId,
          byRole: user.role,
          at: new Date().toISOString(),
        };

        const touristRoom = acctRoom("tourist", convo.tourist_id);
        const agencyRoom = acctRoom("agency", convo.agency_id);

        const touristVisible = Number(convo?.deleted_for_tourist || 0) === 0;
        const agencyVisible = Number(convo?.deleted_for_agency || 0) === 0;

        if (user.role === "tourist") {
          if (agencyVisible) io.to(agencyRoom).emit("chat:read", payload);
          socket.to(touristRoom).emit("chat:read", payload);
        } else {
          if (touristVisible) io.to(touristRoom).emit("chat:read", payload);
          socket.to(agencyRoom).emit("chat:read", payload);
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
        if (!canAccessConversation(user, convo)) return;
        if (!isConversationVisibleToUser(user, convo)) return;

        const otherSideVisible =
          user.role === "tourist"
            ? Number(convo?.deleted_for_agency || 0) === 0
            : Number(convo?.deleted_for_tourist || 0) === 0;

        if (!otherSideVisible) return;

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
        if (!isConversationVisibleToUser(user, convo)) return;

        const otherSideVisible =
          user.role === "tourist"
            ? Number(convo?.deleted_for_agency || 0) === 0
            : Number(convo?.deleted_for_tourist || 0) === 0;

        if (!otherSideVisible) return;

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
        if (!canAccessConversation(user, convo)) {
          return ack?.({ ok: false, message: "Not allowed." });
        }
        if (!isConversationVisibleToUser(user, convo)) {
          return ack?.({ ok: false, message: "Conversation not found." });
        }

        const saved = await addMessage(conversationId, {
          senderId: user.id,
          senderRole: user.role,
          message: text,
        });

        const refreshedConvo = await getConversationById(conversationId);
        if (!refreshedConvo) {
          return ack?.({ ok: false, message: "Conversation not found." });
        }

        const payload = { conversationId, message: saved };

        const touristRoom = acctRoom("tourist", refreshedConvo.tourist_id);
        const agencyRoom = acctRoom("agency", refreshedConvo.agency_id);

        const touristVisible = Number(refreshedConvo?.deleted_for_tourist || 0) === 0;
        const agencyVisible = Number(refreshedConvo?.deleted_for_agency || 0) === 0;

        if (user.role === "tourist") {
          if (agencyVisible) {
            io.to(agencyRoom).emit("chat:message", payload);
          }
          socket.to(touristRoom).emit("chat:message", payload);
        } else {
          if (touristVisible) {
            io.to(touristRoom).emit("chat:message", payload);
          }
          socket.to(agencyRoom).emit("chat:message", payload);
        }

        ack?.({ ok: true, message: saved });

        const receiverId =
          user.role === "tourist"
            ? Number(refreshedConvo.agency_id)
            : Number(refreshedConvo.tourist_id);

        const receiverVisible =
          user.role === "tourist"
            ? Number(refreshedConvo?.deleted_for_agency || 0) === 0
            : Number(refreshedConvo?.deleted_for_tourist || 0) === 0;

        if (receiverVisible) {
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
        if (!isConversationVisibleToUser(user, convo)) return;

        if (user.role === "tourist") {
          await markAgencyMessagesRead(conversationId);
        }

        if (user.role === "agency") {
          await markTouristMessagesRead(conversationId);
        }

        const payload = {
          conversationId,
          byRole: user.role,
          at: new Date().toISOString(),
        };

        const touristRoom = acctRoom("tourist", convo.tourist_id);
        const agencyRoom = acctRoom("agency", convo.agency_id);

        const touristVisible = Number(convo?.deleted_for_tourist || 0) === 0;
        const agencyVisible = Number(convo?.deleted_for_agency || 0) === 0;

        if (user.role === "tourist") {
          if (agencyVisible) io.to(agencyRoom).emit("chat:read", payload);
          socket.to(touristRoom).emit("chat:read", payload);
        } else {
          if (touristVisible) io.to(touristRoom).emit("chat:read", payload);
          socket.to(agencyRoom).emit("chat:read", payload);
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
        if (!canAccessConversation(user, convo)) {
          return ack?.({ ok: false, message: "Not allowed." });
        }
        if (!isConversationVisibleToUser(user, convo)) {
          return ack?.({ ok: false, message: "Conversation not found." });
        }

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

        const touristVisible = Number(convo?.deleted_for_tourist || 0) === 0;
        const agencyVisible = Number(convo?.deleted_for_agency || 0) === 0;

        if (user.role === "tourist") {
          if (agencyVisible) io.to(agencyRoom).emit("chat:deleted", payload);
          socket.to(touristRoom).emit("chat:deleted", payload);
        } else {
          if (touristVisible) io.to(touristRoom).emit("chat:deleted", payload);
          socket.to(agencyRoom).emit("chat:deleted", payload);
        }

        ack?.({ ok: true });
      } catch (e) {
        console.error("chat:delete error", e);
        ack?.({ ok: false, message: "Delete failed." });
      }
    });
  });
}