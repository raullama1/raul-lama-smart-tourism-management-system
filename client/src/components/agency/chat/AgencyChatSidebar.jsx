// client/src/components/agency/chat/AgencyChatSidebar.jsx
import { useMemo } from "react";

function getConvoId(c) {
  return Number(c?.conversation_id ?? c?.conversationId ?? c?.id) || null;
}

function formatLastTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function safePreview(c) {
  const deleted =
    Number(c?.last_message_deleted) === 1 ||
    Number(c?.last_message_is_deleted) === 1 ||
    Number(c?.is_deleted) === 1;

  if (deleted) return "This message was deleted";
  return String(c?.last_message || "").trim();
}

/**
 * Computes the label shown before the preview text.
 * Requires backend/API to provide the last message sender role for accuracy.
 */
function getDirectionLabelForAgency(c) {
  const role = String(
    c?.last_message_sender_role ??
      c?.last_sender_role ??
      c?.last_message_role ??
      ""
  )
    .trim()
    .toLowerCase();

  if (!role) return "Received:";
  return role === "agency" ? "Sent:" : "Received:";
}

export default function AgencyChatSidebar({
  search,
  onSearch,
  conversations = [],
  selectedId,
  onSelect,
  onStartNew,
}) {
  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return conversations;

    return (conversations || []).filter((c) => {
      const name = String(c?.tourist_name || c?.name || "").toLowerCase();
      const last = String(safePreview(c) || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, search]);

  return (
    <aside className="w-full md:w-[340px] bg-emerald-900 rounded-2xl p-4 text-white h-[570px] flex flex-col">
      <div className="text-sm font-semibold mb-2 opacity-90">Tourists</div>

      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search Tourist"
          className="w-full rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="text-xs font-semibold opacity-80 mb-2">Recent chats</div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-emerald-950/40 rounded-xl p-3 text-xs text-emerald-50/80">
            No chats yet. Start a new chat to message a tourist.
          </div>
        ) : (
          filtered.map((c) => {
            const convoId = getConvoId(c);
            const active = Number(selectedId) === Number(convoId);
            const unread = Number(c?.unread_count || 0);

            const name = c?.tourist_name || c?.name || "Tourist";
            const preview = safePreview(c);
            const when = formatLastTime(c?.last_message_at);

            const direction = getDirectionLabelForAgency(c);

            return (
              <button
                key={convoId || `${name}-${when}`}
                onClick={() => onSelect?.(c)}
                type="button"
                className={`w-full text-left rounded-xl p-3 border transition outline-none
                  ${
                    active
                      ? "bg-emerald-700 border-emerald-500"
                      : "bg-emerald-950/30 border-emerald-900 hover:bg-emerald-950/50"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm line-clamp-1">{name}</div>

                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="min-w-[22px] h-[22px] px-2 rounded-full bg-white text-emerald-900 text-[11px] flex items-center justify-center font-semibold">
                        {unread}
                      </span>
                    )}
                    <span className="text-[11px] opacity-80">{when}</span>
                  </div>
                </div>

                {preview ? (
                  <div className="mt-1 text-[11px] opacity-90 line-clamp-1">
                    <span className="font-semibold">{direction}</span> {preview}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={onStartNew}
        type="button"
        className="mt-3 w-full rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
      >
        <span className="text-lg leading-none">+</span> Start New Chat
      </button>
    </aside>
  );
}