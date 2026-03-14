// client/src/components/agency/chat/AgencyChatWindow.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { toPublicImageUrl } from "../../../utils/publicImageUrl";

function getConvoId(selected) {
  return Number(selected?.conversation_id ?? selected?.conversationId ?? selected?.id) || null;
}

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

function LoadingOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[5] flex items-center justify-center">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
      <div className="relative z-[6] rounded-2xl border border-gray-100 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-md">
        Start a new chat…
      </div>
    </div>
  );
}

function Avatar({ name, image, size = "h-9 w-9", rounded = "rounded-full" }) {
  const initial = String(name || "T").trim().charAt(0).toUpperCase() || "T";
  const src = toPublicImageUrl(image);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Tourist"}
        className={`${size} ${rounded} shrink-0 border border-emerald-200 bg-white object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} ${rounded} flex shrink-0 items-center justify-center border border-emerald-200 bg-emerald-200 font-semibold text-emerald-900`}
    >
      {initial}
    </div>
  );
}

export default function AgencyChatWindow({
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
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);

  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const msgMenuCloseTimerRef = useRef(null);

  const prevCountRef = useRef(0);
  const prevFirstIdRef = useRef(null);
  const prevLastIdRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  const convoId = getConvoId(selected);
  const title = selected?.tourist_name || "";
  const profileImage = selected?.tourist_profile_image || selected?.profile_image || "";
  const subtitle = useMemo(() => {
    if (!selected) return "";
    return selected?.tourist_email ? selected.tourist_email : "Tourist";
  }, [selected]);

  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef(null);

  const scheduleCloseMsgMenu = (delayMs = 300) => {
    if (msgMenuCloseTimerRef.current) clearTimeout(msgMenuCloseTimerRef.current);
    msgMenuCloseTimerRef.current = setTimeout(() => setOpenMenuId(null), delayMs);
  };

  const cancelCloseMsgMenu = () => {
    if (msgMenuCloseTimerRef.current) clearTimeout(msgMenuCloseTimerRef.current);
    msgMenuCloseTimerRef.current = null;
  };

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
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setConfirmUnsend({ open: false, messageId: null });
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
  }, [messages, typingText, convoId]);

  useEffect(() => {
    prevCountRef.current = 0;
    prevFirstIdRef.current = null;
    prevLastIdRef.current = null;
    prevScrollHeightRef.current = 0;

    typingActiveRef.current = false;
    setOpenMenuId(null);
    setConfirmUnsend({ open: false, messageId: null });
    setConfirmDeleteChat(false);

    cancelCloseMsgMenu();

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      cancelCloseMsgMenu();
    };
  }, [convoId]);

  const emitTyping = () => {
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
    if (!msg || !convoId) return;

    typingActiveRef.current = false;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onStopTyping?.(convoId);

    onSend?.(msg);
    setText("");
  };

  if (!selected) {
    return (
      <section className="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-gray-100 bg-white">
        <div className="max-w-md px-6 text-center">
          <div className="text-lg font-semibold text-gray-900">Select a chat</div>
          <div className="mt-1 text-sm text-gray-500">
            Choose a tourist from the left to view messages.
          </div>
        </div>
      </section>
    );
  }

  const showEmpty = !loading && (messages?.length || 0) === 0;

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-50 px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={title} image={profileImage} size="h-10 w-10" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900 md:text-base">{title}</div>
            <div className="truncate text-[11px] text-gray-500">{subtitle}</div>
          </div>
        </div>

        <div className="hidden text-[11px] text-emerald-900/70 md:block">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="relative flex-1 min-h-0 bg-white">
        <LoadingOverlay show={showOverlay} />

        <div
          ref={listRef}
          className="h-full min-h-0 overflow-y-auto overscroll-contain scroll-smooth space-y-3 px-4 py-4 md:px-5"
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
              const mine = m.sender_role === "agency";
              const isDeleted = Number(m.is_deleted || 0) === 1;

              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && <Avatar name={title} image={profileImage} size="h-8 w-8" />}

                    <div className="group relative max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isDeleted
                            ? "border border-gray-100 bg-gray-50 italic text-gray-500"
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
                          {m?.created_at
                            ? new Date(m.created_at).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </div>

                      {mine && !isDeleted && !String(m.id).startsWith("tmp-") && (
                        <div
                          className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100"
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onBlur={() => {
              if (!convoId) return;
              typingActiveRef.current = false;
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              onStopTyping?.(convoId);
            }}
          />
          <button
            onClick={handleSend}
            type="button"
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
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
        message="This will remove this chat only from your side. The other person will still keep the history."
        dangerText="Delete"
        onCancel={() => setConfirmDeleteChat(false)}
        onConfirm={() => {
          setConfirmDeleteChat(false);
          if (convoId) onDeleteConversation?.(convoId);
        }}
      />
    </section>
  );
}