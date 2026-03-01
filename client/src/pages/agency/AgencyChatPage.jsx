// client/src/pages/agency/AgencyChatPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import AgencyLayout from "../../components/agency/AgencyLayout";
import AgencyChatSidebar from "../../components/agency/chat/AgencyChatSidebar";
import AgencyChatWindow from "../../components/agency/chat/AgencyChatWindow";
import NewAgencyChatModal from "../../components/agency/chat/NewAgencyChatModal";

import { useAgencyAuth } from "../../context/AgencyAuthContext";
import {
  fetchAgencyConversations,
  startConversationAsAgency,
  fetchMessages,
  sendMessage,
  markRead,
  deleteMessage,
  deleteConversationAsAgency,
} from "../../api/chatApi";
import { getSocket } from "../../socket";

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

export default function AgencyChatPage() {
  const { token } = useAgencyAuth();

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
      if (!silent && reqId === activeConvoReqRef.current) setMsgLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const s = getSocket(token);
    socketRef.current = s;

    const onChatMessage = ({ conversationId, message }) => {
      markConvoNotEmpty(conversationId);

      setConvos((prev) => {
        const next = [...(prev || [])];
        const idx = next.findIndex((x) => Number(getConvoId(x)) === Number(conversationId));
        if (idx >= 0) {
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

      const isOpen = Number(selectedIdRef.current) === Number(conversationId);
      if (!isOpen) return;

      if (message?.sender_role === "agency") return;

      setMessages((prev) => {
        const next = [...(prev || []), message];
        writeCache(conversationId, next, paginationRef.current);
        return next;
      });

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
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
  }, [token]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (convos || []).find((c) => Number(getConvoId(c)) === Number(selectedId));
  }, [convos, selectedId]);

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
        last_message: "",
        last_message_at: "",
        last_message_sender_role: "",
        unread_count: 0,
      };

      setConvos((prev) => [newConvo, ...(prev || [])]);

      setSelectedId(convoId);
      setTypingText("");

      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });
      setMsgLoading(true);

      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:join", { conversationId: convoId });
      }

      loadMessagesPage(convoId, 1, { silent: true });
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

  return (
    <AgencyLayout>
      <div className="mt-5 flex flex-col md:flex-row gap-4">
        <AgencyChatSidebar
          search={search}
          onSearch={setSearch}
          conversations={filteredConvos}
          selectedId={selectedId}
          onSelect={handleSelect}
          onStartNew={() => setShowNewChat(true)}
        />

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

      {loadingConvos && <div className="mt-3 text-xs text-gray-500">Loading chats...</div>}

      <NewAgencyChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPickTourist={handlePickTourist}
        excludeTouristIds={excludeTouristIds}
      />
    </AgencyLayout>
  );
}