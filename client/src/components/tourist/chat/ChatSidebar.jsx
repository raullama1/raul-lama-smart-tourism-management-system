// client/src/components/tourist/chat/ChatSidebar.jsx
import { useMemo } from "react";
import { FiMessageSquare, FiSearch } from "react-icons/fi";
import { toPublicImageUrl } from "../../../utils/publicImageUrl";

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

function getDirectionLabelForTourist(c) {
  const role = String(
    c?.last_message_sender_role ?? c?.last_sender_role ?? c?.last_message_role ?? ""
  )
    .trim()
    .toLowerCase();

  if (!role) return "Received:";
  return role === "tourist" ? "Sent:" : "Received:";
}

function Avatar({ name, image }) {
  const initial = String(name || "A").trim().charAt(0).toUpperCase() || "A";
  const src = toPublicImageUrl(image);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Agency"}
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

export default function ChatSidebar({
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
      const name = String(c?.agency_name || c?.name || "").toLowerCase();
      const last = String(safePreview(c) || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, search]);

  return (
    <aside
      className={`flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-emerald-950/10 bg-emerald-900 text-white shadow-[0_20px_60px_rgba(6,78,59,0.18)] ${
        isMobile ? "min-h-[72dvh]" : "h-[72dvh]"
      }`}
    >
      <div className="border-b border-white/10 px-4 pb-4 pt-4 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/75">
              Agencies
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
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search agency or message"
            className="w-full rounded-2xl border border-white/10 bg-white px-10 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="mt-4 text-xs font-semibold text-emerald-100/75">Recent chats</div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 md:px-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-emerald-950/40 p-4 text-sm text-emerald-50/80">
            No chats yet. Start a new chat to message an agency.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const convoId = c?.conversation_id;
              const active = Number(selectedId) === Number(convoId);
              const unread = Number(c?.unread_count || 0);

              const name = c?.agency_name || c?.name || "Agency";
              const image = c?.agency_profile_image || c?.profile_image || "";
              const preview = safePreview(c);
              const when = formatLastTime(c?.last_message_at);
              const direction = getDirectionLabelForTourist(c);

              return (
                <button
                  key={convoId}
                  onClick={() => onSelect(c)}
                  type="button"
                  className={`w-full rounded-2xl border p-3 text-left outline-none transition ${
                    active
                      ? "border-emerald-400 bg-emerald-700"
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
            })}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 md:p-4">
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