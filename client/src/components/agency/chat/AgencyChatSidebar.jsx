// client/src/components/agency/chat/AgencyChatSidebar.jsx
import { useMemo } from "react";
import { FiMessageSquare, FiSearch } from "react-icons/fi";
import { toPublicImageUrl } from "../../../utils/publicImageUrl";

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

function getDirectionLabelForAgency(c) {
  const role = String(
    c?.last_message_sender_role ?? c?.last_sender_role ?? c?.last_message_role ?? ""
  )
    .trim()
    .toLowerCase();

  if (!role) return "Received:";
  return role === "agency" ? "Sent:" : "Received:";
}

function Avatar({ name, image }) {
  const initial = String(name || "T").trim().charAt(0).toUpperCase() || "T";
  const src = toPublicImageUrl(image);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Tourist"}
        className="h-12 w-12 rounded-2xl border border-emerald-200 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-200 font-semibold text-emerald-900">
      {initial}
    </div>
  );
}

export default function AgencyChatSidebar({
  search,
  onSearch,
  conversations = [],
  selectedId,
  onSelect,
  onStartNew,
  isMobile = false,
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
    <aside
      className={`flex min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-emerald-900 p-3 text-white md:p-4 ${
        isMobile ? "min-h-[68dvh]" : "h-full"
      }`}
    >
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/75">
              Tourists
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-white">Your Chats</div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <FiMessageSquare size={18} />
          </div>
        </div>

        <div className="relative mt-4">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/60" />
          <input
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search tourist or message"
            className="w-full rounded-2xl bg-white px-10 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="mt-4 text-xs font-semibold text-emerald-100/75">Recent chats</div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-3 pr-1">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-emerald-950/40 p-4 text-sm text-emerald-50/80">
            No chats yet. Start a new chat to message a tourist.
          </div>
        ) : (
          filtered.map((c) => {
            const convoId = getConvoId(c);
            const active = Number(selectedId) === Number(convoId);
            const unread = Number(c?.unread_count || 0);

            const name = c?.tourist_name || c?.name || "Tourist";
            const image = c?.tourist_profile_image || c?.profile_image || "";
            const preview = safePreview(c);
            const when = formatLastTime(c?.last_message_at);
            const direction = getDirectionLabelForAgency(c);

            return (
              <button
                key={convoId || `${name}-${when}`}
                onClick={() => onSelect?.(c)}
                type="button"
                className={`w-full rounded-2xl border p-3 text-left outline-none transition ${
                  active
                    ? "border-emerald-500 bg-emerald-700"
                    : "border-emerald-900 bg-emerald-950/30 hover:bg-emerald-950/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={name} image={image} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="line-clamp-1 text-sm font-semibold">{name}</div>

                      <div className="flex shrink-0 items-center gap-2">
                        {unread > 0 && (
                          <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold text-emerald-900">
                            {unread}
                          </span>
                        )}
                        <span className="text-[11px] opacity-80">{when}</span>
                      </div>
                    </div>

                    {preview ? (
                      <div className="mt-1 line-clamp-1 text-[11px] opacity-90">
                        <span className="font-semibold">{direction}</span> {preview}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] italic text-emerald-100/70">
                        No messages yet
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-white/10 pt-3">
        <button
          onClick={onStartNew}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <span className="text-lg leading-none">+</span> Start New Chat
        </button>
      </div>
    </aside>
  );
}