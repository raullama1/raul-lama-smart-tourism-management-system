// client/src/components/tourist/chat/ChatWindow.jsx
import { useEffect, useMemo, useRef, useState } from "react";

function ConfirmModal({
  open,
  title,
  message,
  dangerText = "Delete",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 p-5">
        <div className="text-base font-semibold text-gray-900">{title}</div>
        <div className="mt-1 text-sm text-gray-600">{message}</div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {dangerText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ open, onClose, onDelete }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[115]" onClick={onClose} />

      <div className="absolute right-0 top-full mt-2 z-[116]">
        <div className="flex justify-end pr-3">
          <div className="h-3 w-3 bg-white border-l border-t border-gray-100 rotate-45 translate-y-[6px]" />
        </div>

        <div className="w-56 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden origin-top-right animate-[menuIn_120ms_ease-out]">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-900">Chat options</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Manage this conversation</div>
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete chat
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

function LoadingOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[5] flex items-center justify-center">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
      <div className="relative z-[6] rounded-2xl bg-white border border-gray-100 shadow-md px-4 py-2 text-xs font-semibold text-gray-700">
        Start a new chat…
      </div>
    </div>
  );
}

export default function ChatWindow({
  selected,
  messages = [],
  loading,
  hasMore,
  onLoadMore,
  onSend,
  typingText,
  onTyping,
  onStopTyping,
  onDeleteMessage,
  onDeleteConversation,
}) {
  const [text, setText] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmUnsend, setConfirmUnsend] = useState({ open: false, messageId: null });

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);

  const listRef = useRef(null);

  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);

  const menuCloseTimerRef = useRef(null);

  const scheduleCloseMenu = () => {
    if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = setTimeout(() => setOpenMenuId(null), 350);
  };

  const prevCountRef = useRef(0);
  const prevFirstIdRef = useRef(null);
  const prevLastIdRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  const title = selected?.agency_name || "";
  const subtitle = useMemo(() => {
    if (!selected) return "";
    const addr = selected.agency_address || selected.agency_location;
    return addr ? `Nepal • ${addr}` : "Nepal";
  }, [selected]);

  // Delay showing overlay to avoid blink on fast loads
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef(null);

  useEffect(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);

    if (loading) {
      overlayTimerRef.current = setTimeout(() => setShowOverlay(true), 160);
    } else {
      setShowOverlay(false);
    }

    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [loading]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!e.target.closest?.("[data-msgmenu]")) setOpenMenuId(null);
      if (!e.target.closest?.("[data-headmenu]")) setHeaderMenuOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setConfirmUnsend({ open: false, messageId: null });
        setHeaderMenuOpen(false);
        setConfirmDeleteChat(false);
      }
    };

    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const box = listRef.current;
    if (!box) return;

    const curCount = messages?.length || 0;
    const prevCount = prevCountRef.current;

    const firstId = messages?.[0]?.id ?? null;
    const lastId = messages?.[curCount - 1]?.id ?? null;

    const prevFirstId = prevFirstIdRef.current;
    const prevLastId = prevLastIdRef.current;

    const isPrepend =
      prevCount > 0 &&
      curCount > prevCount &&
      firstId !== prevFirstId &&
      lastId === prevLastId;

    const isFirstLoad = prevCount === 0 && curCount > 0;

    if (isPrepend) {
      const newScrollHeight = box.scrollHeight;
      const delta = newScrollHeight - (prevScrollHeightRef.current || 0);
      box.scrollTop = box.scrollTop + delta;
    } else if (isFirstLoad || curCount > prevCount || typingText) {
      box.scrollTop = box.scrollHeight;
    }

    prevCountRef.current = curCount;
    prevFirstIdRef.current = firstId;
    prevLastIdRef.current = lastId;
    prevScrollHeightRef.current = box.scrollHeight;
  }, [messages, typingText, selected?.conversation_id]);

  useEffect(() => {
    prevCountRef.current = 0;
    prevFirstIdRef.current = null;
    prevLastIdRef.current = null;
    prevScrollHeightRef.current = 0;

    typingActiveRef.current = false;
    setOpenMenuId(null);
    setConfirmUnsend({ open: false, messageId: null });
    setHeaderMenuOpen(false);
    setConfirmDeleteChat(false);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    };
  }, [selected?.conversation_id]);

  const emitTyping = () => {
    const convoId = selected?.conversation_id;
    if (!convoId) return;

    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      onTyping?.(convoId);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      onStopTyping?.(convoId);
    }, 600);
  };

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;

    const convoId = selected?.conversation_id;
    if (convoId) {
      typingActiveRef.current = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onStopTyping?.(convoId);
    }

    onSend(msg);
    setText("");
  };

  if (!selected) {
    return (
      <section className="flex-1 bg-white rounded-2xl border border-gray-100 h-[570px] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-lg font-semibold text-gray-900">Select a chat</div>
          <div className="mt-1 text-sm text-gray-500">
            Choose an agency from the left to view messages.
          </div>
        </div>
      </section>
    );
  }

  const showEmpty = !loading && (messages?.length || 0) === 0;

  return (
    <section className="flex-1 bg-white rounded-2xl border border-gray-100 h-[570px] flex flex-col overflow-hidden">
      <div className="px-4 md:px-5 py-3 border-b border-gray-100 bg-emerald-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center font-semibold text-emerald-900">
            {title?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm md:text-base">{title}</div>
            <div className="text-[11px] text-gray-500">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-emerald-900/70">{subtitle}</div>

          <div className="relative" data-headmenu>
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              className="h-9 w-9 rounded-full border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 flex items-center justify-center"
              title="Menu"
            >
              ⋯
            </button>

            <ActionMenu
              open={headerMenuOpen}
              onClose={() => setHeaderMenuOpen(false)}
              onDelete={() => {
                setHeaderMenuOpen(false);
                setConfirmDeleteChat(true);
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-white">
        <LoadingOverlay show={showOverlay} />

        <div ref={listRef} className="h-full overflow-y-auto px-4 md:px-5 py-4 space-y-3">
          {hasMore && !loading && (
            <div className="flex justify-center">
              <button
                onClick={onLoadMore}
                type="button"
                className="px-4 py-2 rounded-full border border-gray-100 text-xs text-gray-700 hover:bg-gray-50"
              >
                Load older messages
              </button>
            </div>
          )}

          {showEmpty ? (
            <div className="text-sm text-gray-500">No messages yet. Say hello 👋</div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_role === "tourist";
              const isDeleted = Number(m.is_deleted || 0) === 1;

              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="relative group max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                        ${
                          isDeleted
                            ? "bg-gray-50 text-gray-500 italic border border-gray-100"
                            : mine
                            ? "bg-emerald-700 text-white"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                    >
                      <div className="whitespace-pre-line">
                        {isDeleted ? "This message was deleted" : m.message}
                      </div>

                      <div
                        className={`mt-1 text-[10px] ${
                          isDeleted
                            ? "text-gray-400"
                            : mine
                            ? "text-white/70"
                            : "text-emerald-900/60"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {mine && !isDeleted && !String(m.id).startsWith("tmp-") && (
                      <div
                        className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition"
                        data-msgmenu
                        onMouseLeave={() => {
                          if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
                          menuCloseTimerRef.current = setTimeout(() => setOpenMenuId(null), 350);
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((prev) => (prev === m.id ? null : m.id))}
                          className="h-8 w-8 rounded-full border border-gray-100 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm"
                          title="More"
                        >
                          ⋯
                        </button>

                        {openMenuId === m.id && (
                          <div className="absolute bottom-full mb-2 right-0 w-36 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmUnsend({ open: true, messageId: m.id });
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Unsend
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {typingText ? <div className="text-xs text-gray-500 italic">{typingText}</div> : null}
        </div>
      </div>

      <div className="p-3 md:p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            onBlur={() => {
              const convoId = selected?.conversation_id;
              if (!convoId) return;
              typingActiveRef.current = false;
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              onStopTyping?.(convoId);
            }}
          />
          <button
            onClick={handleSend}
            type="button"
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-sm font-semibold"
          >
            Send
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmUnsend.open}
        title="Unsend message?"
        message="This will remove the message for everyone in this chat."
        dangerText="Unsend"
        onCancel={() => setConfirmUnsend({ open: false, messageId: null })}
        onConfirm={() => {
          const id = confirmUnsend.messageId;
          setConfirmUnsend({ open: false, messageId: null });
          if (id) onDeleteMessage?.(id);
        }}
      />

      <ConfirmModal
        open={confirmDeleteChat}
        title="Delete this chat?"
        message="This will permanently delete the whole conversation and all messages."
        dangerText="Delete"
        onCancel={() => setConfirmDeleteChat(false)}
        onConfirm={() => {
          setConfirmDeleteChat(false);
          const convoId = selected?.conversation_id;
          if (convoId) onDeleteConversation?.(convoId);
        }}
      />
    </section>
  );
}