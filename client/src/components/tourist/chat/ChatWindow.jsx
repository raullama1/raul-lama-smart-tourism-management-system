// client/src/components/tourist/chat/ChatWindow.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiMoreHorizontal, FiSend } from "react-icons/fi";
import { toPublicImageUrl } from "../../../utils/publicImageUrl";

function ConfirmModal({ open, title, message, dangerText = "Delete", onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
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

      <div className="absolute right-0 top-full z-[116] mt-2">
        <div className="flex justify-end pr-3">
          <div className="h-3 w-3 translate-y-[6px] rotate-45 border-l border-t border-gray-100 bg-white" />
        </div>

        <div className="w-56 origin-top-right animate-[menuIn_120ms_ease-out] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="text-xs font-semibold text-gray-900">Chat options</div>
            <div className="mt-0.5 text-[11px] text-gray-500">Manage this conversation</div>
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete chat
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
      <div className="relative z-[6] rounded-2xl border border-gray-100 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-md">
        Loading messages...
      </div>
    </div>
  );
}

function Avatar({ name, image, size = "h-9 w-9", rounded = "rounded-full" }) {
  const letter = (name || "A").trim().charAt(0).toUpperCase();
  const src = toPublicImageUrl(image);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Agency"}
        className={`${size} ${rounded} shrink-0 border border-emerald-200 bg-white object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} ${rounded} flex shrink-0 items-center justify-center border border-emerald-200 bg-emerald-200 font-semibold text-emerald-900`}
    >
      {letter}
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
  isMobile = false,
  onBack,
}) {
  const [text, setText] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmUnsend, setConfirmUnsend] = useState({ open: false, messageId: null });
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);

  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const msgMenuCloseTimerRef = useRef(null);

  const scheduleCloseMsgMenu = (delayMs = 300) => {
    if (msgMenuCloseTimerRef.current) clearTimeout(msgMenuCloseTimerRef.current);
    msgMenuCloseTimerRef.current = setTimeout(() => setOpenMenuId(null), delayMs);
  };

  const cancelCloseMsgMenu = () => {
    if (msgMenuCloseTimerRef.current) clearTimeout(msgMenuCloseTimerRef.current);
    msgMenuCloseTimerRef.current = null;
  };

  const prevCountRef = useRef(0);
  const prevFirstIdRef = useRef(null);
  const prevLastIdRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  const title = selected?.agency_name || "";
  const profileImage = selected?.agency_profile_image || selected?.profile_image || "";
  const subtitle = useMemo(() => {
    if (!selected) return "";
    const addr = selected.agency_address || selected.agency_location;
    return addr ? `Nepal • ${addr}` : "Nepal";
  }, [selected]);

  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef(null);

  useEffect(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);

    if (loading) overlayTimerRef.current = setTimeout(() => setShowOverlay(true), 160);
    else setShowOverlay(false);

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
      if (msgMenuCloseTimerRef.current) clearTimeout(msgMenuCloseTimerRef.current);
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

    cancelCloseMsgMenu();

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      cancelCloseMsgMenu();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <section className="flex min-h-[72dvh] flex-1 items-center justify-center rounded-[28px] border border-gray-100 bg-white">
        <div className="max-w-md px-6 text-center">
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
    <section
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] ${
        isMobile ? "h-[calc(100dvh-10rem)] min-h-[520px] max-h-[calc(100dvh-10rem)]" : "h-[72dvh]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-emerald-50 px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {isMobile ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-900 transition hover:bg-emerald-50"
              aria-label="Back to chats"
            >
              <FiArrowLeft size={18} />
            </button>
          ) : null}

          <Avatar name={title} image={profileImage} size="h-10 w-10" rounded="rounded-2xl" />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900 md:text-base">{title}</div>
            <div className="truncate text-[11px] text-gray-500">{subtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-[11px] text-emerald-900/70 md:block">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>

          <div className="relative" data-headmenu>
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-900 transition hover:bg-emerald-50"
              title="Menu"
            >
              <FiMoreHorizontal size={18} />
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

      <div className="relative min-h-0 flex-1 bg-white">
        <LoadingOverlay show={showOverlay} />

        <div
          ref={listRef}
          className="h-full min-h-0 space-y-3 overflow-y-auto overscroll-contain scroll-smooth px-4 py-4 md:px-5"
        >
          {hasMore && !loading && (
            <div className="flex justify-center">
              <button
                onClick={onLoadMore}
                type="button"
                className="rounded-full border border-gray-100 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
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
                  <div
                    className={`flex max-w-[94%] items-end gap-2 sm:max-w-[88%] ${
                      mine ? "flex-row-reverse" : ""
                    }`}
                  >
                    {!mine && (
                      <Avatar name={title} image={profileImage} size="h-8 w-8" rounded="rounded-full" />
                    )}

                    <div className="relative max-w-[100%] group">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isDeleted
                            ? "border border-gray-100 bg-gray-50 italic text-gray-500"
                            : mine
                              ? "bg-emerald-700 text-white"
                              : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        <div className="whitespace-pre-line break-words">
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
                          className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                          data-msgmenu
                          onMouseEnter={cancelCloseMsgMenu}
                          onMouseLeave={() => scheduleCloseMsgMenu(320)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              cancelCloseMsgMenu();
                              setOpenMenuId((prev) => (prev === m.id ? null : m.id));
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                            title="More"
                          >
                            ⋯
                          </button>

                          {openMenuId === m.id && (
                            <div
                              className="absolute bottom-full right-0 mb-2 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
                              onMouseEnter={cancelCloseMsgMenu}
                              onMouseLeave={() => scheduleCloseMsgMenu(320)}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setConfirmUnsend({ open: true, messageId: m.id });
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Unsend
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {typingText ? <div className="text-xs italic text-gray-500">{typingText}</div> : null}
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white p-3 md:p-4">
        <div className="flex items-end gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            placeholder="Type a message..."
            className="min-h-[48px] flex-1 rounded-2xl border border-gray-100 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
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
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 md:px-5"
          >
            <FiSend size={16} />
            <span className="hidden sm:inline">Send</span>
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
        message="This will remove this chat only from your side. The other person will still keep the old history. If you start this chat again later, it will open as a fresh chat for you."
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