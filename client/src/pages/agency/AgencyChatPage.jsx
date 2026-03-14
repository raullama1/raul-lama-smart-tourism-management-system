// client/src/pages/agency/AgencyChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiBell, FiMessageSquare, FiZap } from "react-icons/fi";
import { motion } from "framer-motion";
import AgencyLayout from "../../components/agency/AgencyLayout";
import AgencyChatSidebar from "../../components/agency/chat/AgencyChatSidebar";
import AgencyChatWindow from "../../components/agency/chat/AgencyChatWindow";
import NewAgencyChatModal from "../../components/agency/chat/NewAgencyChatModal";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import {
  fetchAgencyConversations,
  startConversationAsAgency,
  fetchMessages,
  sendMessage,
  markRead,
  deleteMessage,
  deleteConversationAsAgency,
  fetchChatTourists,
} from "../../api/chatApi";
import { getAgencySocket } from "../../socket";

const PAGE_LIMIT = 20;

function getConvoId(c) {
  const v = c?.conversation_id ?? c?.conversationId ?? c?.id;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getTouristIdFromConvo(c) {
  const v = c?.tourist_id ?? c?.touristId ?? c?.tourist?.id;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hasAnyMessagePreview(c) {
  const last = String(c?.last_message || "").trim();
  const at = String(c?.last_message_at || "").trim();
  return Boolean(last || at);
}

function AgencyChatPageContent({ openNotifications }) {
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();
  const [searchParams] = useSearchParams();

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [convos, setConvos] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    hasMore: false,
  });

  const [showNewChat, setShowNewChat] = useState(false);
  const [typingText, setTypingText] = useState("");

  const socketRef = useRef(null);
  const activeConvoReqRef = useRef(0);
  const autoOpenedConversationRef = useRef("");
  const autoOpenedTouristRef = useRef("");

  const selectedIdRef = useRef(null);
  const paginationRef = useRef(pagination);
  const convosRef = useRef(convos);
  const tokenRef = useRef(token);

  const messageCacheRef = useRef(new Map());
  const pendingEmptyConvosRef = useRef(new Set());

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    selectedIdRef.current = selectedId ? Number(selectedId) : null;
  }, [selectedId]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    convosRef.current = convos;
  }, [convos]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const writeCache = (conversationId, nextMessages, nextPagination) => {
    if (!conversationId) return;
    messageCacheRef.current.set(Number(conversationId), {
      messages: nextMessages || [],
      pagination: nextPagination || { page: 1, limit: PAGE_LIMIT, hasMore: false },
      lastUpdatedAt: Date.now(),
    });
  };

  const readCache = (conversationId) => {
    if (!conversationId) return null;
    return messageCacheRef.current.get(Number(conversationId)) || null;
  };

  const clearCacheFor = (conversationId) => {
    if (!conversationId) return;
    messageCacheRef.current.delete(Number(conversationId));
  };

  const markConvoNotEmpty = (conversationId) => {
    if (!conversationId) return;
    pendingEmptyConvosRef.current.delete(Number(conversationId));
  };

  const cleanupEmptyConvosOnServer = async (list) => {
    if (!token) return list || [];

    const empties = (list || []).filter((c) => !hasAnyMessagePreview(c));
    if (empties.length === 0) return list || [];

    const keep = (list || []).filter((c) => hasAnyMessagePreview(c));

    const curSelected = Number(selectedIdRef.current || 0);
    const selectedWasEmpty = empties.some((c) => Number(getConvoId(c)) === curSelected);

    if (selectedWasEmpty) {
      setSelectedId(null);
      setMessages([]);
      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });
      setTypingText("");
    }

    for (const c of empties) {
      const cid = getConvoId(c);
      if (!cid) continue;

      try {
        await deleteConversationAsAgency(token, cid, { onlyIfEmpty: true });
      } catch (e) {
        console.error("cleanup empty convo failed", cid, e);
      }
    }

    return keep;
  };

  const loadConvos = async ({ silent = false } = {}) => {
    if (!token) return;

    try {
      if (!silent) setLoadingConvos(true);

      const res = await fetchAgencyConversations(token);
      const list = res.data || [];

      const cleaned = await cleanupEmptyConvosOnServer(list);
      setConvos(cleaned);
    } catch (e) {
      console.error("loadConvos error", e);
      setConvos([]);
    } finally {
      if (!silent) setLoadingConvos(false);
    }
  };

  useEffect(() => {
    loadConvos({ silent: false });
  }, [token]);

  const markConversationRead = async (conversationId) => {
    if (!token || !conversationId) return;

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:markRead", { conversationId });
      } else {
        await markRead(token, conversationId);
      }
    } catch (e) {
      console.error("markConversationRead error", e);
    }

    setConvos((prev) =>
      (prev || []).map((c) => {
        const id = getConvoId(c);
        return Number(id) === Number(conversationId) ? { ...c, unread_count: 0 } : c;
      })
    );
  };

  const loadMessagesPage = async (conversationId, page, { silent = false } = {}) => {
    if (!token || !conversationId) return;

    const reqId = ++activeConvoReqRef.current;

    try {
      if (!silent) setMsgLoading(true);

      const res = await fetchMessages(token, conversationId, {
        page,
        limit: PAGE_LIMIT,
      });

      if (reqId !== activeConvoReqRef.current) return;

      let nextMessages = [];
      if (page > 1) {
        nextMessages = [...(res.messages || []), ...(messages || [])];
        setMessages(nextMessages);
      } else {
        nextMessages = res.messages || [];
        setMessages(nextMessages);
      }

      const nextPagination = res.pagination || { page, limit: PAGE_LIMIT, hasMore: false };
      setPagination(nextPagination);

      writeCache(conversationId, nextMessages, nextPagination);

      if ((nextMessages || []).length > 0) markConvoNotEmpty(conversationId);

      await markConversationRead(conversationId);
    } catch (e) {
      console.error("loadMessagesPage error", e);

      if (reqId === activeConvoReqRef.current) {
        setMessages([]);
        setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });
        clearCacheFor(conversationId);
      }
    } finally {
      if (reqId === activeConvoReqRef.current) {
        setMsgLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!token) return;

    const s = getAgencySocket(token);
    socketRef.current = s;

    const onChatMessage = ({ conversationId, message }) => {
      markConvoNotEmpty(conversationId);

      let found = false;

      setConvos((prev) => {
        const next = [...(prev || [])];
        const idx = next.findIndex((x) => Number(getConvoId(x)) === Number(conversationId));

        if (idx >= 0) {
          found = true;

          const updated = {
            ...next[idx],
            last_message: message?.is_deleted ? "This message was deleted" : message?.message,
            last_message_at: message?.created_at,
            last_message_sender_role: message?.sender_role || next[idx]?.last_message_sender_role,
          };

          const isOpen = Number(selectedIdRef.current) === Number(conversationId);
          if (!isOpen && message?.sender_role !== "agency") {
            updated.unread_count = Number(updated.unread_count || 0) + 1;
          }

          next[idx] = updated;
          const [item] = next.splice(idx, 1);
          next.unshift(item);
        }

        return next;
      });

      if (!found) {
        loadConvos({ silent: true });
      }

      const isOpen = Number(selectedIdRef.current) === Number(conversationId);
      if (!isOpen) return;
      if (message?.sender_role === "agency") return;

      setMessages((prev) => {
        const exists = (prev || []).some((m) => Number(m.id) === Number(message?.id));
        if (exists) return prev;

        const next = [...(prev || []), message];
        writeCache(conversationId, next, paginationRef.current);
        return next;
      });

      setMsgLoading(false);
      markConversationRead(conversationId);
    };

    const onTyping = ({ conversationId, name }) => {
      if (Number(selectedIdRef.current) === Number(conversationId)) {
        setTypingText(`${name || "Tourist"} is typing...`);
      }
    };

    const onStopTyping = ({ conversationId }) => {
      if (Number(selectedIdRef.current) === Number(conversationId)) {
        setTypingText("");
      }
    };

    const onRead = ({ conversationId }) => {
      setConvos((prev) =>
        (prev || []).map((c) =>
          Number(getConvoId(c)) === Number(conversationId) ? { ...c, unread_count: 0 } : c
        )
      );
    };

    const onDeleted = ({ conversationId, messageId }) => {
      const isOpen = Number(selectedIdRef.current) === Number(conversationId);

      if (isOpen) {
        setMessages((prev) => {
          const next = (prev || []).map((m) =>
            Number(m.id) === Number(messageId) ? { ...m, is_deleted: 1 } : m
          );
          writeCache(conversationId, next, paginationRef.current);
          return next;
        });
      } else {
        const cached = readCache(conversationId);
        if (cached?.messages?.length) {
          const next = cached.messages.map((m) =>
            Number(m.id) === Number(messageId) ? { ...m, is_deleted: 1 } : m
          );
          writeCache(conversationId, next, cached.pagination);
        }
      }

      setConvos((prev) =>
        (prev || []).map((c) =>
          Number(getConvoId(c)) === Number(conversationId)
            ? { ...c, last_message: "This message was deleted" }
            : c
        )
      );
    };

    s.on("chat:message", onChatMessage);
    s.on("chat:typing", onTyping);
    s.on("chat:stopTyping", onStopTyping);
    s.on("chat:read", onRead);
    s.on("chat:deleted", onDeleted);

    return () => {
      try {
        s.off("chat:message", onChatMessage);
        s.off("chat:typing", onTyping);
        s.off("chat:stopTyping", onStopTyping);
        s.off("chat:read", onRead);
        s.off("chat:deleted", onDeleted);
      } catch {}
      socketRef.current = null;
    };
  }, [token]);

  const deleteEmptyIfPending = async (conversationId) => {
    if (!token || !conversationId) return;

    try {
      const res = await deleteConversationAsAgency(token, conversationId, { onlyIfEmpty: true });
      if (res?.ok) {
        pendingEmptyConvosRef.current.delete(Number(conversationId));
        clearCacheFor(conversationId);
      }
    } catch (e) {
      console.error("deleteEmptyIfPending error", e);
    }
  };

  const handleSelect = (c) => {
    const nextId = getConvoId(c);
    if (!nextId) return;

    const prevId = selectedIdRef.current;

    if (prevId && pendingEmptyConvosRef.current.has(Number(prevId))) {
      const prevItem = (convosRef.current || []).find(
        (x) => Number(getConvoId(x)) === Number(prevId)
      );
      if (prevItem && !hasAnyMessagePreview(prevItem)) {
        setConvos((prev) => (prev || []).filter((x) => Number(getConvoId(x)) !== Number(prevId)));
        deleteEmptyIfPending(prevId);
      } else {
        pendingEmptyConvosRef.current.delete(Number(prevId));
      }
    }

    if (prevId && socketRef.current?.connected) {
      socketRef.current.emit("chat:leave", { conversationId: prevId });
    }

    setSelectedId(nextId);
    setTypingText("");
    setMessages([]);

    const cached = readCache(nextId);
    if (cached) {
      setMessages(cached.messages || []);
      setPagination(cached.pagination || { page: 1, limit: PAGE_LIMIT, hasMore: false });
      setMsgLoading(false);
    } else {
      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:join", { conversationId: nextId });
    }

    loadMessagesPage(nextId, 1, { silent: !!cached });
  };

  const handleOpenTouristConversation = async (touristId) => {
    const touristIdNum = Number(touristId);
    if (!tokenRef.current || !touristIdNum) return;

    const existing = (convosRef.current || []).find(
      (c) => Number(getTouristIdFromConvo(c)) === touristIdNum
    );

    if (existing) {
      handleSelect(existing);
      return;
    }

    try {
      const touristListRes = await fetchChatTourists(tokenRef.current, { search: "" });
      const tourist =
        (touristListRes?.data || []).find((t) => Number(t?.id) === touristIdNum) || null;

      const res = await startConversationAsAgency(tokenRef.current, touristIdNum);

      const convoId =
        Number(res?.conversation?.id) ||
        Number(res?.conversation_id) ||
        Number(res?.conversationId) ||
        Number(res?.id);

      if (!convoId) return;

      pendingEmptyConvosRef.current.add(Number(convoId));

      const newConvo = {
        conversation_id: convoId,
        tourist_id: touristIdNum,
        tourist_name: String(tourist?.name || "Tourist"),
        tourist_email: String(tourist?.email || ""),
        tourist_phone: String(tourist?.phone || ""),
        tourist_profile_image: String(tourist?.profile_image || ""),
        last_message: "",
        last_message_at: "",
        last_message_sender_role: "",
        unread_count: 0,
      };

      setConvos((prev) => {
        const alreadyExists = (prev || []).some(
          (c) => Number(getConvoId(c)) === Number(convoId)
        );
        if (alreadyExists) return prev;
        return [newConvo, ...(prev || [])];
      });

      setSelectedId(convoId);
      setMessages([]);
      setTypingText("");
      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });

      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:join", { conversationId: convoId });
      }

      loadMessagesPage(convoId, 1, { silent: false });
    } catch (e) {
      console.error("handleOpenTouristConversation error", e);
    }
  };

  useEffect(() => {
    const paramId = Number(searchParams.get("conversationId") || 0);
    if (!paramId || loadingConvos) return;

    const key = String(paramId);
    if (autoOpenedConversationRef.current === key) return;

    const target = (convos || []).find((c) => Number(getConvoId(c)) === Number(paramId));
    if (!target) return;

    autoOpenedConversationRef.current = key;
    handleSelect(target);
  }, [searchParams, convos, loadingConvos]);

  useEffect(() => {
    const touristId = Number(searchParams.get("touristId") || 0);
    if (!touristId || loadingConvos || !token) return;

    const key = String(touristId);
    if (autoOpenedTouristRef.current === key) return;

    autoOpenedTouristRef.current = key;
    handleOpenTouristConversation(touristId);
  }, [searchParams, convos, loadingConvos, token]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (convos || []).find((c) => Number(getConvoId(c)) === Number(selectedId));
  }, [convos, selectedId]);

  const handleSend = async (text) => {
    if (!selectedId || !token) return;

    const conversationId = Number(selectedId);
    markConvoNotEmpty(conversationId);

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      sender_role: "agency",
      message: text,
      created_at: new Date().toISOString(),
      is_deleted: 0,
    };

    setMessages((prev) => {
      const next = [...(prev || []), optimistic];
      writeCache(conversationId, next, paginationRef.current);
      return next;
    });

    setConvos((prev) => {
      const next = [...(prev || [])];
      const idx = next.findIndex((x) => Number(getConvoId(x)) === Number(conversationId));
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          last_message: text,
          last_message_at: new Date().toISOString(),
          last_message_sender_role: "agency",
        };
        const [item] = next.splice(idx, 1);
        next.unshift(item);
      }
      return next;
    });

    setMsgLoading(false);

    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:send", { conversationId, message: text }, (ack) => {
        if (!ack?.ok) {
          setMessages((prev) => {
            const next = (prev || []).filter((m) => m.id !== tempId);
            writeCache(conversationId, next, paginationRef.current);
            return next;
          });
          alert("Failed to send message.");
          return;
        }

        const saved = ack.message;
        setMessages((prev) => {
          const next = (prev || []).map((m) => (m.id === tempId ? saved : m));
          writeCache(conversationId, next, paginationRef.current);
          return next;
        });
      });
      return;
    }

    try {
      const res = await sendMessage(token, conversationId, text);
      const saved = res.message;

      if (!saved) {
        setMessages((prev) => {
          const next = (prev || []).filter((m) => m.id !== tempId);
          writeCache(conversationId, next, paginationRef.current);
          return next;
        });
        alert("Failed to send message.");
        return;
      }

      setMessages((prev) => {
        const next = (prev || []).map((m) => (m.id === tempId ? saved : m));
        writeCache(conversationId, next, paginationRef.current);
        return next;
      });
    } catch (e) {
      console.error("send message error", e);
      setMessages((prev) => {
        const next = (prev || []).filter((m) => m.id !== tempId);
        writeCache(conversationId, next, paginationRef.current);
        return next;
      });
      alert("Failed to send message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const conversationId = selectedIdRef.current;
    if (!conversationId || !messageId || !token) return;

    setMessages((prev) => {
      const next = (prev || []).map((m) =>
        Number(m.id) === Number(messageId) ? { ...m, is_deleted: 1 } : m
      );
      writeCache(conversationId, next, paginationRef.current);
      return next;
    });

    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:delete", { conversationId, messageId }, (ack) => {
        if (!ack?.ok) {
          alert("Failed to unsend message.");
          loadMessagesPage(conversationId, 1);
        }
      });
      return;
    }

    try {
      const res = await deleteMessage(token, conversationId, messageId);
      if (!res?.ok) {
        alert("Failed to unsend message.");
        loadMessagesPage(conversationId, 1);
      }
    } catch (e) {
      console.error("delete message error", e);
      alert("Failed to unsend message.");
      loadMessagesPage(conversationId, 1);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    const cid = Number(conversationId);
    if (!cid || !token) return;

    const wasOpen = Number(selectedIdRef.current) === cid;

    setConvos((prev) => (prev || []).filter((c) => Number(getConvoId(c)) !== cid));
    pendingEmptyConvosRef.current.delete(cid);
    clearCacheFor(cid);

    if (wasOpen) {
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:leave", { conversationId: cid });
      }
      setSelectedId(null);
      setMessages([]);
      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });
      setTypingText("");
      setMsgLoading(false);
    }

    try {
      const res = await deleteConversationAsAgency(token, cid);
      if (!res?.ok) {
        alert("Failed to delete chat.");
        loadConvos({ silent: true });
      }
    } catch (e) {
      console.error("delete conversation error", e);
      alert("Failed to delete chat.");
      loadConvos({ silent: true });
    }
  };

  const loadOlder = () => {
    if (!selectedId) return;
    if (!pagination?.hasMore) return;
    loadMessagesPage(Number(selectedId), (pagination.page || 1) + 1);
  };

  const filteredConvos = useMemo(() => {
    if (loadingConvos) return [];
    const q = search.trim().toLowerCase();
    if (!q) return convos;

    return (convos || []).filter((c) => {
      const name = String(c.tourist_name || c.name || "").toLowerCase();
      const last = String(c.last_message || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [convos, loadingConvos, search]);

  const excludeTouristIds = useMemo(() => {
    return (convos || [])
      .map((c) => getTouristIdFromConvo(c))
      .filter((x) => Number.isFinite(Number(x)));
  }, [convos]);

  const handlePickTourist = async (tourist) => {
    try {
      setShowNewChat(false);

      const touristId = Number(tourist?.id);
      const touristName = String(tourist?.name || "Tourist");
      const touristEmail = String(tourist?.email || "");
      const touristProfileImage = String(tourist?.profile_image || "");

      if (!touristId) {
        alert("Invalid tourist.");
        return;
      }

      const existing = (convos || []).find(
        (c) => Number(getTouristIdFromConvo(c)) === Number(touristId)
      );

      if (existing) {
        handleSelect(existing);
        return;
      }

      const res = await startConversationAsAgency(token, touristId);

      const convoId =
        Number(res?.conversation?.id) ||
        Number(res?.conversation_id) ||
        Number(res?.conversationId) ||
        Number(res?.id);

      if (!convoId) {
        alert("Failed to start chat.");
        return;
      }

      pendingEmptyConvosRef.current.add(Number(convoId));

      const newConvo = {
        conversation_id: convoId,
        tourist_id: Number(touristId),
        tourist_name: touristName,
        tourist_email: touristEmail,
        tourist_profile_image: touristProfileImage,
        last_message: "",
        last_message_at: "",
        last_message_sender_role: "",
        unread_count: 0,
      };

      setConvos((prev) => [newConvo, ...(prev || [])]);
      setMessages([]);
      setSelectedId(convoId);
      setTypingText("");
      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });

      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:join", { conversationId: convoId });
      }

      loadMessagesPage(convoId, 1, { silent: false });
    } catch (e) {
      console.error("start chat error", e);
      alert("Failed to start chat.");
    }
  };

  const handleTyping = (conversationId) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("chat:typing", { conversationId });
  };

  const handleStopTyping = (conversationId) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("chat:stopTyping", { conversationId });
  };

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (px - 0.5) * 10,
      y: (py - 0.5) * -10,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-emerald-50 via-white to-teal-100/70 p-2.5 sm:p-3 lg:p-4 shadow-[0_18px_70px_rgba(16,185,129,0.10)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl" />
        </div>

        <div className="relative flex h-full min-h-0 flex-col rounded-[24px] border border-white/70 bg-white/75 backdrop-blur-2xl shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.10),transparent_30%)]" />

            <div className="relative border-b border-emerald-100/80 px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6">
              <div className="flex items-center justify-between gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    animate={{ rotateX: tilt.y, rotateY: tilt.x }}
                    transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.7 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="shrink-0"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                      <FiMessageSquare className="text-[20px]" />
                    </div>
                  </motion.div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                      Chat
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      <FiZap className="text-[11px]" />
                      Live
                    </span>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  type="button"
                  onClick={handleOpenNotifications}
                  className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-white/90 text-emerald-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <FiBell className="text-[17px]" />
                  {Number(unreadCount || 0) > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white shadow-lg shadow-red-500/20">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col p-2.5 sm:p-3 lg:p-4">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)]"
              >
                <div className="min-h-0 rounded-[20px] border border-white/70 bg-white/80 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                  <AgencyChatSidebar
                    search={search}
                    onSearch={setSearch}
                    conversations={filteredConvos}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onStartNew={() => setShowNewChat(true)}
                  />
                </div>

                <div className="min-h-0 rounded-[20px] border border-white/70 bg-white/85 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                  <AgencyChatWindow
                    selected={selected}
                    messages={messages}
                    loading={msgLoading}
                    hasMore={!!pagination?.hasMore}
                    onLoadMore={loadOlder}
                    onSend={handleSend}
                    typingText={typingText}
                    onTyping={handleTyping}
                    onStopTyping={handleStopTyping}
                    onDeleteMessage={handleDeleteMessage}
                    onDeleteConversation={handleDeleteConversation}
                  />
                </div>
              </motion.div>

              {loadingConvos && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-sm">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  Loading chats...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NewAgencyChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPickTourist={handlePickTourist}
        excludeTouristIds={excludeTouristIds}
      />
    </>
  );
}

export default function AgencyChatPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyChatPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}