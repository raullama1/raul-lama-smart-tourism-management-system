import { useEffect, useMemo, useRef, useState } from "react";
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
import { getSocket } from "../../socket";

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

  // Conversations created/opened but still empty (no message ever sent/received)
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

  const loadConvos = async ({ silent = false } = {}) => {
    if (!token) return;

    try {
      if (!silent) setLoadingConvos(true);
      const res = await fetchMyConversations(token);
      const list = res.data || [];
      setConvos(list);
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

    const onAuthError = (payload) => {
      console.log("socket auth_error", payload);
    };

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

      const isOpen = Number(selectedIdRef.current) === Number(conversationId);
      if (!isOpen) return;

      if (message?.sender_role === "tourist") return;

      setMessages((prev) => {
        const next = [...(prev || []), message];
        writeCache(conversationId, next, paginationRef.current);
        return next;
      });

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

    s.on("auth_error", onAuthError);
    s.on("chat:message", onChatMessage);
    s.on("chat:typing", onTyping);
    s.on("chat:stopTyping", onStopTyping);
    s.on("chat:read", onRead);
    s.on("chat:deleted", onDeleted);

    return () => {
      try {
        s.off("auth_error", onAuthError);
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

    const cached = readCache(nextId);
    if (cached) {
      setMessages(cached.messages || []);
      setPagination(cached.pagination || { page: 1, limit: PAGE_LIMIT, hasMore: false });
      setMsgLoading(false);
    } else {
      setMessages([]);
      setPagination({ page: 1, limit: PAGE_LIMIT, hasMore: false });
      setMsgLoading(true);
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

  // ✅ UPDATED: receives full agency object from NewChatModal
  const handlePickAgency = async (agency) => {
    try {
      setShowNewChat(false);

      const agencyId = Number(agency?.id);
      const agencyName = String(agency?.name || "Agency");
      const agencyAddress = String(agency?.address || "Nepal");

      if (!agencyId) {
        alert("Invalid agency.");
        return;
      }

      // If chat already exists with this agency, open it
      const existing = (convos || []).find(
        (c) => Number(getAgencyIdFromConvo(c)) === Number(agencyId)
      );
      if (existing) {
        handleSelect(existing);
        return;
      }

      // Create on server
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

      // Insert locally using agency object (instant correct name/address)
      const newConvo = {
        conversation_id: convoId,
        agency_id: Number(agencyId),
        agency_name: agencyName,
        agency_address: agencyAddress,
        last_message: "",
        last_message_at: "",
        unread_count: 0,
      };

      setConvos((prev) => [newConvo, ...(prev || [])]);

      // Open immediately
      setSelectedId(convoId);
      setTypingText("");
      setMessages([]);
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
    <>
      <NavbarTourist />

      <main className="bg-[#f3faf6] pt-6 pb-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-4">
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

          {loadingConvos && <div className="mt-3 text-xs text-gray-500">Loading chats...</div>}
        </div>
      </main>

      <FooterTourist />

      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPickAgency={handlePickAgency}
        excludeAgencyIds={excludeAgencyIds}
      />
    </>
  );
}
