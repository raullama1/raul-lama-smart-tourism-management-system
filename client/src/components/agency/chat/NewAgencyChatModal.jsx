// client/src/components/agency/chat/NewAgencyChatModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchChatTourists } from "../../../api/chatApi";
import { useAgencyAuth } from "../../../context/AgencyAuthContext";

function Avatar({ name }) {
  const letter = (name || "T").trim().charAt(0).toUpperCase();
  return (
    <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-extrabold">
      {letter}
    </div>
  );
}

export default function NewAgencyChatModal({
  open,
  onClose,
  onPickTourist,
  excludeTouristIds = [],
}) {
  const { token } = useAgencyAuth();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourists, setTourists] = useState([]);
  const [startingId, setStartingId] = useState(null);

  const reqRef = useRef(0);

  const excludeSet = useMemo(() => {
    const s = new Set();
    (excludeTouristIds || []).forEach((x) => {
      const n = Number(x);
      if (Number.isFinite(n)) s.add(n);
    });
    return s;
  }, [excludeTouristIds]);

  const shown = useMemo(() => {
    const list = tourists || [];
    return list.filter((t) => !excludeSet.has(Number(t.id)));
  }, [tourists, excludeSet]);

  const loadTourists = async (q) => {
    if (!token) return;
    const myReq = ++reqRef.current;

    try {
      setLoading(true);

      // Must pass agency token explicitly (do not rely on interceptor)
      const res = await fetchChatTourists(token, { search: q });

      if (myReq !== reqRef.current) return;
      setTourists(res?.data || []);
    } catch (e) {
      if (myReq !== reqRef.current) return;
      console.error("fetchChatTourists error", e);
      setTourists([]);
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setTourists([]);
    setStartingId(null);
    loadTourists("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadTourists(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showEmpty = !loading && (shown?.length || 0) === 0;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-lg font-extrabold text-gray-900">Start New Chat</div>
            {loading && <div className="text-xs text-gray-500">Searching...</div>}
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50"
            type="button"
          >
            ✕ Close
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tourists..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {showEmpty ? (
            <div className="text-sm text-gray-500">
              No tourists found (or you already have chats with them).
            </div>
          ) : (
            shown.map((t) => {
              const id = Number(t.id);
              const name = t.name || "Tourist";
              const email = t.email || "";
              const phone = t.phone || "";

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-gray-200 bg-[#f3faf6] p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={name} />
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-gray-900 truncate">{name}</div>
                      <div className="text-xs text-gray-600 truncate mt-0.5">
                        {email}
                        {phone ? ` • ${phone}` : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={startingId === id}
                    onClick={async () => {
                      try {
                        setStartingId(id);
                        await onPickTourist?.(t);
                      } finally {
                        setStartingId(null);
                      }
                    }}
                    className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2 text-sm font-black text-white hover:bg-emerald-900 disabled:opacity-70"
                    type="button"
                  >
                    {startingId === id ? "Starting..." : "Start Chat"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}