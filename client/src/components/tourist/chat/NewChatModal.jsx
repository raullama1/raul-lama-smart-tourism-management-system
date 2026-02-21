// client/src/components/tourist/chat/NewChatModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { fetchChatAgencies } from "../../../api/chatApi";
import { useAuth } from "../../../context/AuthContext";

function Avatar({ name }) {
  const letter = (name || "A").trim().charAt(0).toUpperCase();
  return (
    <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-semibold">
      {letter}
    </div>
  );
}

export default function NewChatModal({
  open,
  onClose,
  onPickAgency,
  excludeAgencyIds = [],
}) {
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false); // used for spinner label, but don't hide list
  const [agencies, setAgencies] = useState([]);
  const [startingId, setStartingId] = useState(null);

  // prevents old slow responses from overriding latest search
  const reqRef = useRef(0);

  const excludeSet = useMemo(() => {
    const s = new Set();
    (excludeAgencyIds || []).forEach((x) => {
      const n = Number(x);
      if (Number.isFinite(n)) s.add(n);
    });
    return s;
  }, [excludeAgencyIds]);

  const shown = useMemo(() => {
    const list = agencies || [];
    return list.filter((a) => !excludeSet.has(Number(a.id)));
  }, [agencies, excludeSet]);

  const loadAgencies = async (q) => {
    if (!token) return;

    const myReq = ++reqRef.current;

    try {
      setLoading(true);
      const res = await fetchChatAgencies(token, { search: q });

      // ignore stale response
      if (myReq !== reqRef.current) return;

      // ✅ keep list stable; just replace with latest results
      setAgencies(res.data || []);
    } catch (e) {
      // ignore stale response
      if (myReq !== reqRef.current) return;

      console.error("fetchChatAgencies error", e);

      // ✅ IMPORTANT: do NOT clear agencies here (prevents flicker)
      // keep previous list visible
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  };

  // On open: load once
  useEffect(() => {
    if (!open) return;
    setSearch("");
    loadAgencies("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadAgencies(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, open]);

  // Esc close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showEmpty =
    !loading && (shown?.length || 0) === 0; // show empty msg only when not loading

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-gray-900">Start New Chat</div>
            {loading && (
              <div className="text-xs text-gray-500">Searching...</div>
            )}
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            type="button"
          >
            ✕ Close
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search travel agencies..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {showEmpty ? (
            <div className="text-sm text-gray-500">
              No agencies found (or you already have chats with them).
            </div>
          ) : (
            shown.map((a) => {
              const id = Number(a.id);
              const name = a.name || "Agency";
              const address = a.address || "Nepal";

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-gray-200 bg-[#f4fbf7] p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={name} />

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {name}
                      </div>
                      <div className="text-xs text-emerald-700 truncate mt-0.5">
                        {address}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={startingId === id}
                    onClick={async () => {
                      try {
                        setStartingId(id);
                        await onPickAgency?.(a); // pass full agency object
                      } finally {
                        setStartingId(null);
                      }
                    }}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-70"
                    type="button"
                  >
                    <FaPaperPlane />
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