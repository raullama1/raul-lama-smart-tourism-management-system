// client/src/pages/tourist/TouristChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiMessageSquare, FiZap } from "react-icons/fi";
import { motion } from "framer-motion";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import ChatSidebar from "../../components/tourist/chat/ChatSidebar";
import ChatWindow from "../../components/tourist/chat/ChatWindow";
import NewChatModal from "../../components/tourist/chat/NewChatModal";
import { useAuth } from "../../context/AuthContext";
import {
  fetchMyConversations,
  startConversation,
  fetchMessages,
  sendMessage,
  markRead,
  deleteMessage,
  deleteConversation,
} from "../../api/chatApi";
import { getTouristSocket } from "../../socket";

const PAGE_LIMIT = 20;

function getConvoId(c) {
  const v = c?.conversation_id ?? c?.conversationId ?? c?.id;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getAgencyIdFromConvo(c) {
  const v = c?.agency_id ?? c?.agencyId ?? c?.agency?.id;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hasAnyMessagePreview(c) {
  const last = String(c?.last_message || "").trim();
  const at = String(c?.last_message_at || "").trim();
  return Boolean(last || at);
}

export default function TouristChatPage() {
  const { token } = useAuth();
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const socketRef = useRef(null);
  const activeConvoReqRef = useRef(0);
  const autoOpenedRef = useRef("");

  const selectedIdRef = useRef(null);
  useEffect(() => {
    selectedIdRef.current = selectedId ? Number(selectedId) : null;
  }, [selectedId]);

  const paginationRef = useRef(pagination);
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const messageCacheRef = useRef(new Map());
  const pendingEmptyConvosRef = useRef(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
        await deleteConversation(token, cid, { onlyIfEmpty: true });
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

      const res = await fetchMyConversations(token);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const s = getTouristSocket(token);
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
          if (!isOpen && message?.sender_role !== "tourist") {
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
      if (message?.sender_role === "tourist") return;

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
        setTypingText(`${name || "Agency"} is typing...`);
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
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const paramId = Number(searchParams.get("conversationId") || 0);
    if (!paramId || loadingConvos) return;

    const key = String(paramId);
    if (autoOpenedRef.current === key) return;

    const target = (convos || []).find((c) => Number(getConvoId(c)) === Number(paramId));
    if (!target) return;

    autoOpenedRef.current = key;
    handleSelect(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, convos, loadingConvos]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (convos || []).find((c) => Number(getConvoId(c)) === Number(selectedId));
  }, [convos, selectedId]);

  const deleteEmptyIfPending = async (conversationId) => {
    if (!token || !conversationId) return;

    try {
      const res = await deleteConversation(token, conversationId, { onlyIfEmpty: true });
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
      const prevItem = (convos || []).find((x) => Number(getConvoId(x)) === Number(prevId));
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

  const handleSend = async (text) => {
    if (!selectedId || !token) return;

    const conversationId = Number(selectedId);
    markConvoNotEmpty(conversationId);

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      sender_role: "tourist",
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
          last_message_sender_role: "tourist",
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
      const res = await deleteConversation(token, cid);
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
      const name = String(c.agency_name || c.name || "").toLowerCase();
      const last = String(c.last_message || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [convos, loadingConvos, search]);

  const excludeAgencyIds = useMemo(() => {
    return (convos || [])
      .map((c) => getAgencyIdFromConvo(c))
      .filter((x) => Number.isFinite(Number(x)));
  }, [convos]);

  const handlePickAgency = async (agency) => {
    try {
      setShowNewChat(false);

      const agencyId = Number(agency?.id);
      const agencyName = String(agency?.name || "Agency");
      const agencyAddress = String(agency?.address || "Nepal");
      const agencyProfileImage = String(agency?.profile_image || "");

      if (!agencyId) {
        alert("Invalid agency.");
        return;
      }

      const existing = (convos || []).find(
        (c) => Number(getAgencyIdFromConvo(c)) === Number(agencyId)
      );

      if (existing) {
        handleSelect(existing);
        return;
      }

      const res = await startConversation(token, agencyId);

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
        agency_id: Number(agencyId),
        agency_name: agencyName,
        agency_address: agencyAddress,
        agency_profile_image: agencyProfileImage,
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

  const showSidebarMobile = isMobile && !selected;
  const showWindowMobile = isMobile && !!selected;
  const showDesktopLayout = !isMobile;

  return (
    <div className="relative bg-[#071510]">
      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <FooterTourist />
        </div>

        <div className="relative z-10 bg-[#f3faf6]">
          <NavbarTourist />

          <main className="pb-6 pt-4 md:pb-8 md:pt-6">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <div className="relative mb-4 overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-emerald-50 via-white to-teal-100/70 p-3 shadow-[0_18px_70px_rgba(16,185,129,0.10)] sm:p-4">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -left-10 top-6 h-24 w-24 rounded-full bg-emerald-300/20 blur-3xl" />
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
                </div>

                <div className="relative flex items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/75 px-4 py-3 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:px-5">
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
                </div>
              </div>

              <div className="min-h-[70dvh]">
                {showDesktopLayout ? (
                  <div className="grid min-h-[72dvh] grid-cols-1 gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
                    <ChatSidebar
                      search={search}
                      onSearch={setSearch}
                      conversations={filteredConvos}
                      selectedId={selectedId}
                      onSelect={handleSelect}
                      onStartNew={() => setShowNewChat(true)}
                    />

                    <ChatWindow
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
                ) : (
                  <div className="min-h-[72dvh]">
                    {showSidebarMobile ? (
                      <ChatSidebar
                        search={search}
                        onSearch={setSearch}
                        conversations={filteredConvos}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onStartNew={() => setShowNewChat(true)}
                        isMobile
                      />
                    ) : null}

                    {showWindowMobile ? (
                      <ChatWindow
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
                        isMobile
                        onBack={() => setSelectedId(null)}
                      />
                    ) : null}
                  </div>
                )}
              </div>

              {loadingConvos && <div className="mt-3 text-xs text-gray-500">Loading chats...</div>}
            </div>
          </main>
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>

      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPickAgency={handlePickAgency}
        excludeAgencyIds={excludeAgencyIds}
      />
    </div>
  );
}