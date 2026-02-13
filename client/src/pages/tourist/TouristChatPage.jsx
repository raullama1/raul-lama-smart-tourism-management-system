// client/src/pages/tourist/TouristChatPage.jsx
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
} from "../../api/chatApi";
import { getSocket } from "../../socket";

export default function TouristChatPage() {
  const { token } = useAuth();

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [convos, setConvos] = useState([]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: false,
  });

  const [showNewChat, setShowNewChat] = useState(false);
  const [typingText, setTypingText] = useState("");

  const socketRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const loadConvos = async () => {
    if (!token) return;
    try {
      setLoadingConvos(true);
      const res = await fetchMyConversations(token);
      setConvos(res.data || []);
    } catch (e) {
      console.error("loadConvos error", e);
      setConvos([]);
    } finally {
      setLoadingConvos(false);
    }
  };

  useEffect(() => {
    loadConvos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadMessagesPage = async (conversationId, page) => {
    if (!token || !conversationId) return;
    try {
      setMsgLoading(true);
      const res = await fetchMessages(token, conversationId, { page, limit: 20 });

      if (page > 1) {
        setMessages((prev) => [...(res.messages || []), ...(prev || [])]);
      } else {
        setMessages(res.messages || []);
      }

      setPagination(res.pagination || { page, limit: 20, hasMore: false });

      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:markRead", { conversationId });
      } else {
        await markRead(token, conversationId);
      }

      loadConvos();
    } catch (e) {
      console.error("loadMessagesPage error", e);
      setMessages([]);
      setPagination({ page: 1, limit: 20, hasMore: false });
    } finally {
      setMsgLoading(false);
    }
  };

  // Socket init (shared socket)
  useEffect(() => {
    if (!token) return;

    const s = getSocket(token);
    socketRef.current = s;

    const onAuthError = (payload) => {
      console.log("socket auth_error", payload);
    };

    const onChatMessage = ({ conversationId, message }) => {
      // Update sidebar preview
      setConvos((prev) => {
        const next = [...(prev || [])];
        const idx = next.findIndex(
          (x) => Number(x.conversation_id) === Number(conversationId)
        );

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            last_message: message?.is_deleted
              ? "This message was deleted"
              : message?.message,
            last_message_at: message?.created_at,
          };
          const [item] = next.splice(idx, 1);
          next.unshift(item);
        }
        return next;
      });

      const cur = selectedRef.current;
      const isOpen =
        cur?.conversation_id &&
        Number(cur.conversation_id) === Number(conversationId);

      if (!isOpen) return;

      // Prevent double append for my own message
      if (message?.sender_role === "tourist") return;

      setMessages((prev) => [...(prev || []), message]);
    };

    const onTyping = ({ conversationId, name }) => {
      if (Number(selectedRef.current?.conversation_id) === Number(conversationId)) {
        setTypingText(`${name || "Agency"} is typing...`);
      }
    };

    const onStopTyping = ({ conversationId }) => {
      if (Number(selectedRef.current?.conversation_id) === Number(conversationId)) {
        setTypingText("");
      }
    };

    const onRead = ({ conversationId }) => {
      setConvos((prev) =>
        (prev || []).map((c) =>
          Number(c.conversation_id) === Number(conversationId)
            ? { ...c, unread_count: 0 }
            : c
        )
      );
    };

    const onDeleted = ({ conversationId, messageId }) => {
      const cur = selectedRef.current;
      const isOpen =
        cur?.conversation_id &&
        Number(cur.conversation_id) === Number(conversationId);

      if (isOpen) {
        setMessages((prev) =>
          (prev || []).map((m) =>
            Number(m.id) === Number(messageId) ? { ...m, is_deleted: 1 } : m
          )
        );
      }

      loadConvos();
    };

    s.on("auth_error", onAuthError);
    s.on("chat:message", onChatMessage);
    s.on("chat:typing", onTyping);
    s.on("chat:stopTyping", onStopTyping);
    s.on("chat:read", onRead);
    s.on("chat:deleted", onDeleted);

    // IMPORTANT: do NOT disconnect shared socket
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSelect = (c) => {
    const prevId = selectedRef.current?.conversation_id;
    if (prevId && socketRef.current?.connected) {
      socketRef.current.emit("chat:leave", { conversationId: prevId });
    }

    setSelected(c);
    setTypingText("");
    setMessages([]);

    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:join", { conversationId: c.conversation_id });
    }

    loadMessagesPage(c.conversation_id, 1);
  };

  const handleSend = async (text) => {
    if (!selected?.conversation_id || !token) return;

    const conversationId = selected.conversation_id;

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      sender_role: "tourist",
      message: text,
      created_at: new Date().toISOString(),
      is_deleted: 0,
    };
    setMessages((prev) => [...(prev || []), optimistic]);

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "chat:send",
        { conversationId, message: text },
        (ack) => {
          if (!ack?.ok) {
            setMessages((prev) => (prev || []).filter((m) => m.id !== tempId));
            alert("Failed to send message.");
            return;
          }
          const saved = ack.message;
          setMessages((prev) => (prev || []).map((m) => (m.id === tempId ? saved : m)));
          loadConvos();
        }
      );
      return;
    }

    try {
      const res = await sendMessage(token, conversationId, text);
      const saved = res.message;

      if (!saved) {
        setMessages((prev) => (prev || []).filter((m) => m.id !== tempId));
        alert("Failed to send message.");
        return;
      }

      setMessages((prev) => (prev || []).map((m) => (m.id === tempId ? saved : m)));
      loadConvos();
    } catch (e) {
      console.error("send message error", e);
      setMessages((prev) => (prev || []).filter((m) => m.id !== tempId));
      alert("Failed to send message.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const conversationId = selectedRef.current?.conversation_id;
    if (!conversationId || !messageId || !token) return;

    setMessages((prev) =>
      (prev || []).map((m) =>
        Number(m.id) === Number(messageId) ? { ...m, is_deleted: 1 } : m
      )
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "chat:delete",
        { conversationId, messageId },
        (ack) => {
          if (!ack?.ok) {
            alert("Failed to unsend message.");
            loadMessagesPage(conversationId, 1);
            return;
          }
          loadConvos();
        }
      );
      return;
    }

    try {
      const res = await deleteMessage(token, conversationId, messageId);
      if (!res?.ok) {
        alert("Failed to unsend message.");
        loadMessagesPage(conversationId, 1);
        return;
      }
      loadConvos();
    } catch (e) {
      console.error("delete message error", e);
      alert("Failed to unsend message.");
      loadMessagesPage(conversationId, 1);
    }
  };

  const loadOlder = () => {
    if (!selected?.conversation_id) return;
    if (!pagination?.hasMore) return;
    loadMessagesPage(selected.conversation_id, (pagination.page || 1) + 1);
  };

  const filteredConvos = useMemo(() => {
    if (loadingConvos) return [];
    const q = search.trim().toLowerCase();
    if (!q) return convos;

    return (convos || []).filter((c) => {
      const name = (c.agency_name || c.name || "").toLowerCase();
      const last = (c.last_message || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [convos, loadingConvos, search]);

  const handlePickAgency = async (agencyId) => {
    try {
      const res = await startConversation(token, agencyId);
      setShowNewChat(false);

      await loadConvos();

      const convoId = res?.conversation?.id;
      if (convoId) {
        const fresh = await fetchMyConversations(token);
        const list = fresh.data || [];
        setConvos(list);
        const found = list.find((x) => Number(x.conversation_id) === Number(convoId));
        if (found) handleSelect(found);
      }
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
              selectedId={selected?.conversation_id}
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
            />
          </div>

          {loadingConvos && (
            <div className="mt-3 text-xs text-gray-500">Loading chats...</div>
          )}
        </div>
      </main>

      <FooterTourist />

      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onPickAgency={handlePickAgency}
      />
    </>
  );
}
