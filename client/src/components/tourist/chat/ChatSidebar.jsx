// client/src/components/tourist/chat/ChatSidebar.jsx
import { useMemo } from "react";

export default function ChatSidebar({
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
      const name = String(c.agency_name || "").toLowerCase();
      const last = String(c.last_message || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, search]);

  return (
    <aside className="w-full md:w-[340px] bg-emerald-900 rounded-2xl p-4 text-white h-[570px] flex flex-col">
      <div className="text-sm font-semibold mb-2 opacity-90">Agencies in Nepal</div>

      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search Agency"
          className="w-full rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="text-xs font-semibold opacity-80 mb-2">Recent chats</div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-emerald-950/40 rounded-xl p-3 text-xs text-emerald-50/80">
            No chats yet. Start a new chat to message an agency.
          </div>
        ) : (
          filtered.map((c) => {
            const active = Number(selectedId) === Number(c.conversation_id);
            const unread = Number(c.unread_count || 0);

            return (
              <button
                key={c.conversation_id}
                onClick={() => onSelect(c)}
                type="button"
                className={`w-full text-left rounded-xl p-3 border transition
                  ${
                    active
                      ? "bg-emerald-700 border-emerald-500"
                      : "bg-emerald-950/30 border-emerald-900 hover:bg-emerald-950/50"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm line-clamp-1">
                    {c.agency_name}
                  </div>

                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="min-w-[22px] h-[22px] px-2 rounded-full bg-white text-emerald-900 text-[11px] flex items-center justify-center font-semibold">
                        {unread}
                      </span>
                    )}

                    <span className="text-[11px] opacity-80">
                      {c.last_message_at
                        ? new Date(c.last_message_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[11px] opacity-90 line-clamp-1">
                  {c.last_message || "Start conversation..."}
                </div>
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
