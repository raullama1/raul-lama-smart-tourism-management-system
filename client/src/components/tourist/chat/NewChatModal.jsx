// client/src/components/tourist/chat/NewChatModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { fetchChatAgencies } from "../../../api/chatApi";
import { useAuth } from "../../../context/AuthContext";
import { toPublicImageUrl } from "../../../utils/publicImageUrl";

function Avatar({ name, image }) {
  const letter = (name || "A").trim().charAt(0).toUpperCase();
  const src = toPublicImageUrl(image);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Agency"}
        className="h-11 w-11 rounded-xl border border-emerald-200 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 font-semibold text-emerald-700">
      {letter}
    </div>
  );
}

export default function NewChatModal({ open, onClose, onPickAgency, excludeAgencyIds = [] }) {
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [startingId, setStartingId] = useState(null);

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

      if (myReq !== reqRef.current) return;

      setAgencies(res.data || []);
    } catch (e) {
      if (myReq !== reqRef.current) return;
      console.error("fetchChatAgencies error", e);
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setSearch("");
    loadAgencies("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadAgencies(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const showEmpty = !loading && (shown?.length || 0) === 0;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="absolute inset-x-0 bottom-0 top-auto flex max-h-[88dvh] flex-col rounded-t-[28px] border border-gray-200 bg-white shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-full md:max-w-[520px] md:rounded-none md:rounded-l-[28px] md:border-l">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">Start New Chat</div>
              {loading ? <div className="text-xs text-gray-500">Searching...</div> : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-800 transition hover:bg-gray-50"
            type="button"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search travel agencies..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {showEmpty ? (
            <div className="text-sm text-gray-500">
              No agencies found (or you already have chats with them).
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((a) => {
                const id = Number(a.id);
                const name = a.name || "Agency";
                const address = a.address || "Nepal";
                const image = a.profile_image || a.agency_profile_image || "";

                return (
                  <div
                    key={id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-[#f4fbf7] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={name} image={image} />

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
                        <div className="mt-0.5 truncate text-xs text-emerald-700">{address}</div>
                      </div>
                    </div>

                    <button
                      disabled={startingId === id}
                      onClick={async () => {
                        try {
                          setStartingId(id);
                          await onPickAgency?.(a);
                        } finally {
                          setStartingId(null);
                        }
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-70"
                      type="button"
                    >
                      <FaPaperPlane />
                      {startingId === id ? "Starting..." : "Start Chat"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}