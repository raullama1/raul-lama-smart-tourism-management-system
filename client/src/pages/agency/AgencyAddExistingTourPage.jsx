// client/src/pages/agency/AgencyAddExistingTourPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiX,
  FiSave,
  FiRefreshCw,
  FiBell,
  FiMapPin,
  FiLayers,
  FiTrendingUp,
  FiCalendar,
  FiArrowRight,
  FiSliders,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
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
      ? "border-emerald-200/80 bg-white text-emerald-950"
      : "border-red-200/80 bg-white text-red-950";

  const iconWrap =
    type === "success"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[400] sm:right-6 sm:top-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto relative w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(16,24,40,0.18)] ${boxClass}`}
            role="status"
            aria-live="polite"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_35%)]" />
            <div className="relative flex items-start gap-3 p-4">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${iconWrap}`}
              >
                <FiBell size={18} />
              </div>

              <div className="min-w-0 flex-1 pr-7">
                <div className="text-sm font-semibold leading-6">{message}</div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close notification"
              >
                <FiX size={16} />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[300]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={busy ? undefined : onClose}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24 }}
              className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
            >
              <div className="relative shrink-0 border-b border-emerald-100/80 px-5 py-4 sm:px-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%)]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                      {title}
                    </div>
                    {subtitle ? (
                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        {subtitle}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={busy ? undefined : onClose}
                    disabled={busy}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    aria-label="Close"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

              {footer ? (
                <div className="shrink-0 border-t border-emerald-100/80 bg-white px-5 py-4 sm:px-6">
                  {footer}
                </div>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
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
  } catch {}
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

function formatPrice(n) {
  return `NPR ${Number(n || 0).toLocaleString("en-NP")}`;
}

function StatCard({ icon, label, value, tone = "emerald" }) {
  const styles = {
    emerald:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-900",
    sky: "border-sky-100 bg-gradient-to-br from-sky-50 to-white text-sky-900",
    violet:
      "border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-900",
  };

  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.07)] ${styles[tone]}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_40%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function FilterShell({ children, className = "" }) {
  return (
    <div
      className={`relative rounded-2xl border border-slate-200 bg-white/90 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function TourCard({ tour, onAdd, index }) {
  const img = toPublicImageUrl(tour.image_url) || FALLBACK_TOUR_IMG;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative h-[220px] overflow-hidden bg-slate-100">
        <motion.img
          src={img}
          alt={tour.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_TOUR_IMG;
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <FiLayers size={14} />
            {tour.type || "Tour"}
          </span>

          <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            {formatPrice(tour.starting_price)}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="line-clamp-2 text-lg font-bold leading-6 text-white">
            {tour.title}
          </div>
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
            <FiMapPin size={14} />
            <span className="truncate">{tour.location}</span>
          </div>
        </div>
      </div>

      <div className="relative p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Category
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {tour.type || "-"}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Starting Price
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {formatPrice(tour.starting_price)}
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onAdd(tour)}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-800 hover:to-emerald-700"
        >
          <FiPlus size={17} />
          Add to My Tours
          <FiArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function AgencyAddExistingTourPageContent({ openNotifications }) {
  const { unreadCount, refresh } = useAgencyNotifications();

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
  const [meta, setMeta] = useState(
    cached?.meta ?? { total: cached?.rows?.length ?? 0 }
  );
  const [err, setErr] = useState("");

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
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

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

  useEffect(() => {
    if (!addOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [addOpen]);

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
    return startDate;
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
  }, [q, type, location, sort]);

  const loadLocations = async () => {
    try {
      const res = await fetchExistingToursLocations();
      const apiList = normalizeLocationList(res?.data);
      const finalList = uniqStrings([...NEPAL_PLACES, ...apiList]);

      setLocations(finalList);
      persist({ locations: finalList });
    } catch {
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
    loadLocations();
    load({ first: true });
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    load({ first: false });
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
    setPrice(tour?.starting_price ? String(tour.starting_price) : "");
    setStartDate("");
    setEndDate("");
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
    const maxEnd = new Date(endMaxYMD);
    if (end < start) return "End date cannot be earlier than start date.";
    if (end > maxEnd) return "End date must be within 3 months after start date.";

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

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  const isDirty =
    q.trim() !== "" || type !== "all" || location !== "all" || sort !== "newest";

  const totalCount = Number(meta?.total || 0);
  const visibleCount = rows.length;
  const typesCount = useMemo(
    () => new Set(rows.map((r) => String(r.type || "").trim()).filter(Boolean)).size,
    [rows]
  );

  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_left,rgba(14,165,233,0.08),transparent_24%)]" />

          <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Agency Portal
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Add Existing Tour
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                Browse the shared tour library, filter smarter, and add polished listings to your agency in seconds.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start">
              {fetching ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  <span className="animate-spin">
                    <FiRefreshCw />
                  </span>
                  Updating...
                </div>
              ) : null}

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenNotifications}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-slate-700 shadow-sm transition hover:bg-emerald-50"
                aria-label="Notifications"
                title="Notifications"
              >
                <FiBell size={18} />

                {Number(unreadCount || 0) > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-h-[22px] min-w-[22px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          <div
            className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
            style={{ perspective: "1200px" }}
          >
            <StatCard
              icon={<FiTrendingUp size={22} />}
              label="Total Tours"
              value={totalCount}
              tone="emerald"
            />
            <StatCard
              icon={<FiSearch size={22} />}
              label="Visible Results"
              value={visibleCount}
              tone="sky"
            />
            <StatCard
              icon={<FiLayers size={22} />}
              label="Tour Types"
              value={typesCount}
              tone="violet"
            />
          </div>

          <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <FilterShell className="flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiSearch size={18} />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-12 w-full rounded-2xl bg-transparent pl-12 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Search tours..."
                />
              </FilterShell>

              <FilterShell className="xl:w-[220px]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiMapPin size={17} />
                </span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl bg-transparent pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none"
                >
                  <option value="all">All Locations</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </FilterShell>

              <FilterShell className="xl:w-[170px]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiLayers size={17} />
                </span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl bg-transparent pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Nature">Nature</option>
                  <option value="Religious">Religious</option>
                </select>
              </FilterShell>

              <FilterShell className="xl:w-[185px]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiSliders size={17} />
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl bg-transparent pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="price-asc">Price Low</option>
                  <option value="price-desc">Price High</option>
                </select>
              </FilterShell>

              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                onClick={clearFilters}
                disabled={!isDirty}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </motion.button>
            </div>
          </div>

          {err ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {err}
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="rounded-[32px] border border-white/60 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
        >
          {initialLoading && rows.length === 0 ? (
            <div className="grid min-h-[280px] place-items-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 text-sm font-semibold text-slate-500">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                Loading tours...
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="grid min-h-[280px] place-items-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-6 text-center text-sm font-semibold text-slate-500">
              No tours available to add.
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-bold tracking-tight text-slate-900">
                    Tour Library
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Browse curated tours and add the ones that match your agency.
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {visibleCount} of {totalCount} shown
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {rows.map((t, index) => (
                  <TourCard key={t.id} tour={t} onAdd={openAdd} index={index} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      <ModalShell
        open={addOpen}
        title="Add this tour"
        subtitle={selected ? `Create your listing for "${selected.title}".` : ""}
        onClose={closeAdd}
        busy={busy}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={closeAdd}
              disabled={busy}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={onAdd}
              disabled={busy}
              className="h-11 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-800 hover:to-emerald-700 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <FiSave />
                {busy ? "Saving..." : "Save"}
              </span>
            </motion.button>
          </div>
        }
      >
        {selected ? (
          <div className="mb-5 overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="h-24 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-36">
                <img
                  src={toPublicImageUrl(selected.image_url) || FALLBACK_TOUR_IMG}
                  alt={selected.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_TOUR_IMG;
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-base font-bold text-slate-900">
                  {selected.title}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
                    <FiMapPin size={13} />
                    {selected.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
                    <FiLayers size={13} />
                    {selected.type || "Tour"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
                    <FiTrendingUp size={13} />
                    {formatPrice(selected.starting_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-700">Price (NPR)</div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              inputMode="numeric"
              placeholder="Enter your price"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiCalendar size={15} />
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
                    const minEnd = new Date(v);
                    const maxEnd = new Date(toYMD(addMonths(new Date(v), 3)));
                    if (end < minEnd || end > maxEnd) setEndDate("");
                  }
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiCalendar size={15} />
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
                  "mt-2 h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                  !startDate
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
                    : "border-slate-200 bg-white text-slate-800",
                ].join(" ")}
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
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
    </>
  );
}

export default function AgencyAddExistingTourPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyAddExistingTourPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}