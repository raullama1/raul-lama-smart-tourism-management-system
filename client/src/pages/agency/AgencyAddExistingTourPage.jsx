// client/src/pages/agency/AgencyAddExistingTourPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiSearch, FiX, FiSave, FiRefreshCw } from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
import {
  addExistingTourListing,
  fetchExistingToursLibrary,
  fetchExistingToursLocations,
} from "../../api/agencyToursApi";
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

const CACHE_KEY = "agency_existing_tours_cache_v1";

const NEPAL_PLACES = [
  "Kathmandu, Nepal",
  "Pokhara, Nepal",
  "Lalitpur, Nepal",
  "Bhaktapur, Nepal",
  "Chitwan, Nepal",
  "Lumbini, Nepal",
  "Janakpur, Nepal",
  "Biratnagar, Nepal",
  "Birgunj, Nepal",
  "Butwal, Nepal",
  "Bhairahawa, Nepal",
  "Dharan, Nepal",
  "Itahari, Nepal",
  "Hetauda, Nepal",
  "Nepalgunj, Nepal",
  "Dhangadhi, Nepal",
  "Bharatpur, Nepal",
  "Gorkha, Nepal",
  "Mustang, Nepal",
  "Solukhumbu, Nepal",
  "Annapurna Region, Nepal",
  "Manang, Nepal",
  "Ilam, Nepal",
  "Bandipur, Nepal",
];

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[400] pointer-events-none">
      <div
        className={[
          "pointer-events-auto w-[320px] rounded-2xl border px-4 py-3 shadow-lg",
          "transition-all duration-300 ease-out",
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          boxClass,
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-700/70 hover:text-gray-900 hover:bg-black/5"
          aria-label="Close notification"
        >
          ✕
        </button>

        <div className="pr-8 text-sm font-semibold">{message}</div>
      </div>
    </div>
  );
}

function ModalShell({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  busy = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={busy ? undefined : onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white shadow-xl border border-emerald-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-emerald-100 flex items-start justify-between gap-3 shrink-0">
            <div>
              <div className="text-base font-semibold text-gray-900">{title}</div>
              {subtitle ? (
                <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={busy ? undefined : onClose}
              disabled={busy}
              className="h-9 w-9 rounded-xl border border-gray-200 bg-white grid place-items-center text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          <div className="px-5 py-5 overflow-y-auto">{children}</div>

          {footer ? (
            <div className="px-5 py-4 border-t border-emerald-100 shrink-0 bg-white">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function splitDates(availableDates) {
  const raw = String(availableDates || "");
  const [a, b] = raw.split("|");
  return { start: a ? a.trim() : "", end: b ? b.trim() : "" };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toYMD(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

function isValidDateString(ymd) {
  if (!ymd) return false;
  const d = new Date(ymd);
  return !Number.isNaN(d.getTime());
}

function blockManualDateInput(e) {
  if (e.type === "keydown" && e.key === "Tab") return;
  e.preventDefault();
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function normalizeLocationList(input) {
  const arr = Array.isArray(input) ? input : [];
  const out = [];

  for (const item of arr) {
    if (typeof item === "string") {
      const v = item.trim();
      if (v) out.push(v);
      continue;
    }

    if (item && typeof item === "object") {
      const v =
        item.location ??
        item.name ??
        item.value ??
        item.label ??
        item.city ??
        item.place;

      if (typeof v === "string" && v.trim()) out.push(v.trim());
    }
  }

  return out;
}

function uniqStrings(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const v = String(x || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export default function AgencyAddExistingTourPage() {
  const cached = useMemo(() => readCache(), []);

  const [q, setQ] = useState(cached?.filters?.q ?? "");
  const [debouncedQ, setDebouncedQ] = useState(
    (cached?.filters?.q ?? "").trim()
  );
  const [type, setType] = useState(cached?.filters?.type ?? "all");
  const [location, setLocation] = useState(cached?.filters?.location ?? "all");
  const [sort, setSort] = useState(cached?.filters?.sort ?? "newest");

  const [initialLoading, setInitialLoading] = useState(
    !(cached?.rows?.length > 0)
  );
  const [fetching, setFetching] = useState(false);

  const [rows, setRows] = useState(cached?.rows ?? []);
  const [meta, setMeta] = useState(cached?.meta ?? { total: cached?.rows?.length ?? 0 });
  const [err, setErr] = useState("");

  // ✅ Show Nepal places immediately (even if cache empty)
  const [locations, setLocations] = useState(() => {
    const cachedLocs = Array.isArray(cached?.locations) ? cached.locations : [];
    const merged = uniqStrings([...NEPAL_PLACES, ...cachedLocs]);
    return merged.length ? merged : NEPAL_PLACES;
  });

  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const latestReqRef = useRef(0);
  const toastTimerRef = useRef(null);

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const params = useMemo(
    () => ({
      q: debouncedQ,
      type,
      location,
      sort,
    }),
    [debouncedQ, type, location, sort]
  );

  const todayYMD = useMemo(() => toYMD(new Date()), []);
  const startMaxYMD = useMemo(() => toYMD(addMonths(new Date(), 3)), []);

  const endMinYMD = useMemo(() => {
    if (!isValidDateString(startDate)) return "";
    return toYMD(addMonths(new Date(startDate), 1));
  }, [startDate]);

  const endMaxYMD = useMemo(() => {
    if (!isValidDateString(startDate)) return "";
    return toYMD(addMonths(new Date(startDate), 3));
  }, [startDate]);

  const persist = (next = {}) => {
    writeCache({
      filters: { q, type, location, sort },
      rows,
      meta,
      locations,
      ...next,
    });
  };

  useEffect(() => {
    persist({ filters: { q, type, location, sort } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, location, sort]);

  const loadLocations = async () => {
    try {
      const res = await fetchExistingToursLocations();
      const apiList = normalizeLocationList(res?.data);

      // ✅ ALWAYS include Nepal places + add API unique ones
      const finalList = uniqStrings([...NEPAL_PLACES, ...apiList]);

      setLocations(finalList);
      persist({ locations: finalList });
    } catch {
      // ✅ still keep Nepal list
      const finalList = uniqStrings([...NEPAL_PLACES, ...locations]);
      setLocations(finalList);
      persist({ locations: finalList });
    }
  };

  const load = async ({ first = false } = {}) => {
    const reqId = ++latestReqRef.current;

    try {
      setErr("");
      if (first && rows.length === 0) setInitialLoading(true);
      else setFetching(true);

      const res = await fetchExistingToursLibrary(params);
      if (reqId !== latestReqRef.current) return;

      const nextRows = res?.data || [];
      const nextMeta = { total: res?.meta?.total ?? nextRows.length };

      setRows(nextRows);
      setMeta(nextMeta);

      persist({ rows: nextRows, meta: nextMeta });
    } catch (e) {
      if (reqId !== latestReqRef.current) return;

      setErr(e?.response?.data?.message || "Failed to load existing tours.");
      setRows([]);
      setMeta({ total: 0 });

      persist({ rows: [], meta: { total: 0 } });
    } finally {
      if (reqId !== latestReqRef.current) return;

      setInitialLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    // ✅ Always refresh locations once on mount (won't remove Nepal list)
    loadLocations();
    load({ first: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    load({ first: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, params.type, params.location, params.sort]);

  const clearFilters = () => {
    setQ("");
    setType("all");
    setLocation("all");
    setSort("newest");
    setErr("");
  };

  const openAdd = (tour) => {
    setErr("");
    setSelected(tour);

    const p = tour?.starting_price ? String(tour.starting_price) : "";
    setPrice(p);

    const d = splitDates(tour?.available_dates_hint);
    setStartDate(d.start || "");
    setEndDate(d.end || "");

    setStatus("active");
    setAddOpen(true);
  };

  const closeAdd = () => {
    if (busy) return;
    setAddOpen(false);
    setSelected(null);
    setPrice("");
    setStartDate("");
    setEndDate("");
    setStatus("active");
  };

  const validate = () => {
    if (!selected?.id) return "Invalid tour.";

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return "Price must be greater than 0.";

    if (!startDate) return "Start date is required.";
    const start = new Date(startDate);
    const today = new Date(todayYMD);
    const startMax = new Date(startMaxYMD);
    if (start < today) return "Start date cannot be in the past.";
    if (start > startMax) return "Start date must be within 3 months from today.";

    if (!endDate) return "End date is required.";
    const end = new Date(endDate);
    const minEnd = new Date(endMinYMD);
    const maxEnd = new Date(endMaxYMD);
    if (end < minEnd) return "End date must be at least 1 month after start.";
    if (end > maxEnd) return "End date must be within 3 months after start.";

    const st = String(status || "").toLowerCase();
    if (!["active", "paused"].includes(st)) return "Invalid status.";

    return "";
  };

  const onAdd = async () => {
    const msg = validate();
    if (msg) {
      setErr(msg);
      showToast("error", msg);
      return;
    }

    try {
      setBusy(true);
      setErr("");

      await addExistingTourListing(selected.id, {
        price: Number(price),
        start_date: startDate,
        end_date: endDate,
        listing_status: String(status).toLowerCase(),
      });

      closeAdd();
      await load({ first: false });
      showToast("success", "Tour added to your listings.");
    } catch (e) {
      const m = e?.response?.data?.message || "Failed to add tour.";
      setErr(m);
      showToast("error", m);
    } finally {
      setBusy(false);
    }
  };

  const isDirty =
    q.trim() !== "" || type !== "all" || location !== "all" || sort !== "newest";

  return (
    <AgencyLayout>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              Add Existing Tour
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Browse the tour library and add a listing to your agency.
            </div>
          </div>

          {fetching ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="animate-spin">
                <FiRefreshCw />
              </span>
              Updating...
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Search tours..."
              />
            </div>
          </div>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="Adventure">Adventure</option>
            <option value="Cultural">Cultural</option>
            <option value="Nature">Nature</option>
            <option value="Religious">Religious</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="price-asc">Sort: Price Low</option>
            <option value="price-desc">Sort: Price High</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!isDirty}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            Clear
          </button>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}

        <div className="mt-5">
          {initialLoading && rows.length === 0 ? (
            <div className="px-2 py-10 text-sm text-gray-600">
              Loading tours...
            </div>
          ) : rows.length === 0 ? (
            <div className="px-2 py-10 text-sm text-gray-600">
              No tours available to add.
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs text-gray-600 font-semibold">
                Total: {meta.total}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rows.map((t) => {
                  const img = toPublicImageUrl(t.image_url) || FALLBACK_TOUR_IMG;

                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-emerald-100 bg-white overflow-hidden shadow-sm"
                    >
                      <div className="h-[160px] bg-gray-50">
                        <img
                          src={img}
                          alt={t.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_TOUR_IMG;
                          }}
                        />
                      </div>

                      <div className="p-4">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1">
                          {t.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                          {t.location}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-emerald-900/80">
                            {t.type}
                          </div>
                          <div className="text-xs font-bold text-gray-900">
                            From NPR{" "}
                            {Number(t.starting_price || 0).toLocaleString("en-NP")}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openAdd(t)}
                          className="mt-4 w-full h-11 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
                        >
                          <span className="inline-flex items-center gap-2">
                            <FiPlus />
                            Add to My Tours
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <ModalShell
        open={addOpen}
        title="Add this tour"
        subtitle={selected ? `Create your listing for "${selected.title}".` : ""}
        onClose={closeAdd}
        busy={busy}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAdd}
              disabled={busy}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onAdd}
              disabled={busy}
              className="h-10 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <FiSave />
                Save
              </span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Price (NPR)
            </div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              inputMode="numeric"
              placeholder="Enter your price"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Start Date
              </div>
              <input
                type="date"
                value={startDate}
                min={todayYMD}
                max={startMaxYMD}
                onKeyDown={blockManualDateInput}
                onPaste={blockManualDateInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartDate(v);

                  if (v && endDate) {
                    const end = new Date(endDate);
                    const minEnd = new Date(toYMD(addMonths(new Date(v), 1)));
                    const maxEnd = new Date(toYMD(addMonths(new Date(v), 3)));
                    if (end < minEnd || end > maxEnd) setEndDate("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="mt-1 text-[11px] text-gray-500">
                Must be within 3 months from today.
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                End Date
              </div>
              <input
                type="date"
                value={endDate}
                min={endMinYMD || undefined}
                max={endMaxYMD || undefined}
                disabled={!startDate}
                onKeyDown={blockManualDateInput}
                onPaste={blockManualDateInput}
                onChange={(e) => setEndDate(e.target.value)}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500",
                  !startDate
                    ? "bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200"
                    : "border-gray-200",
                ].join(" ")}
              />
              <div className="mt-1 text-[11px] text-gray-500">
                Must be 1–3 months after start date.
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Status
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </ModalShell>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </AgencyLayout>
  );
}