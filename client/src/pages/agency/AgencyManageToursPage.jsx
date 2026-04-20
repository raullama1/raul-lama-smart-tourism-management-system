// client/src/pages/agency/AgencyManageToursPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiCheckCircle,
  FiPauseCircle,
  FiEdit2,
  FiX,
  FiSave,
  FiUploadCloud,
  FiMapPin,
  FiChevronDown,
  FiEye,
  FiStar,
  FiLayers,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import {
  deleteAgencyTour,
  fetchAgencyManageTours,
  updateAgencyTour,
  updateAgencyTourStatus,
} from "../../api/agencyToursApi";
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

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
      ? "border-emerald-200 bg-white/95 text-emerald-900"
      : "border-red-200 bg-white/95 text-red-900";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[400] sm:right-6 sm:top-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className={[
              "pointer-events-auto relative w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-[24px] border px-4 py-4 shadow-[0_20px_50px_rgba(16,24,40,0.18)] backdrop-blur-xl",
              boxClass,
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_35%)]" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-600 transition hover:bg-black/5 hover:text-gray-900"
              aria-label="Close notification"
            >
              <FiX />
            </button>

            <div className="relative pr-8 text-sm font-semibold leading-6">
              {message}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function badgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "paused") return "border-amber-200 bg-amber-50 text-amber-700";
  if (s === "completed") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide shadow-sm",
        badgeClass(s),
      ].join(" ")}
    >
      {s === "active" ? (
        <FiCheckCircle />
      ) : s === "paused" ? (
        <FiPauseCircle />
      ) : s === "completed" ? (
        <FiCheckCircle />
      ) : null}
      {label}
    </span>
  );
}

function IconBtn({ children, tone = "default", ...props }) {
  const cls =
    tone === "danger"
      ? "border-red-200 bg-red-50/70 text-red-700 hover:bg-red-50"
      : tone === "neutral"
      ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50";

  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60",
        cls,
      ].join(" ")}
    >
      {children}
    </button>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300]"
        >
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
            onClick={busy ? undefined : onClose}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/60 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
            >
              <div className="shrink-0 border-b border-emerald-100 px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold tracking-tight text-slate-900">
                      {title}
                    </div>
                    {subtitle ? (
                      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={busy ? undefined : onClose}
                    disabled={busy}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    aria-label="Close"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

              {footer ? (
                <div className="shrink-0 border-t border-emerald-100 bg-white px-5 py-4 sm:px-6">
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

function isInsideNepal(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  return la >= 26.35 && la <= 30.45 && lo >= 80.0 && lo <= 88.3;
}

function splitDatesFromRow(r) {
  const s1 = r?.start_date ? String(r.start_date).slice(0, 10) : "";
  const e1 = r?.end_date ? String(r.end_date).slice(0, 10) : "";
  if (s1 && e1) return { start: s1, end: e1 };

  const raw = String(r?.available_dates || "").trim();
  if (!raw) return { start: "", end: "" };

  if (raw.includes("|")) {
    const [a, b] = raw.split("|");
    return { start: a ? a.trim() : "", end: b ? b.trim() : "" };
  }

  if (raw.includes(",")) {
    const parts = raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    return {
      start: parts[0] || "",
      end: parts.length ? parts[parts.length - 1] : "",
    };
  }

  return { start: "", end: "" };
}

function normalizeText(v) {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
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
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) return false;

  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;

  return (
    d.getFullYear() === Number(m[1]) &&
    d.getMonth() + 1 === Number(m[2]) &&
    d.getDate() === Number(m[3])
  );
}

function blockManualDateInput(e) {
  if (e.type === "keydown" && e.key === "Tab") return;
  e.preventDefault();
}

function LazyNepalMapPicker({
  coords,
  setCoords,
  setLatInput,
  setLngInput,
  setErr,
  showToast,
  shouldFly,
  setShouldFly,
}) {
  const [mods, setMods] = useState({ rl: null, L: null });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [rl, leaflet] = await Promise.all([
          import("react-leaflet"),
          import("leaflet"),
        ]);
        const L = leaflet?.default || leaflet;

        if (!alive) return;
        setMods({ rl, L });
      } catch {
        const m = "Failed to load map. Please try again.";
        setErr(m);
        showToast("error", m);
      }
    })();

    return () => {
      alive = false;
    };
  }, [setErr, showToast]);

  const markerIcon = useMemo(() => {
    if (!mods.L) return null;

    return new mods.L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  }, [mods.L]);

  if (!mods.rl || !mods.L || !markerIcon) {
    return (
      <div className="grid h-[240px] place-items-center text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = mods.rl;

  function PickMarker() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (!isInsideNepal(lat, lng)) {
          const m = "Please select a location inside Nepal.";
          setErr(m);
          showToast("error", m);
          return;
        }

        setCoords({ lat, lng });
        setLatInput(String(Number(lat).toFixed(7)));
        setLngInput(String(Number(lng).toFixed(7)));
      },
    });

    return null;
  }

  function FlyToMarker({ active }) {
    const map = useMap();

    useEffect(() => {
      if (!active) return;
      if (!coords?.lat || !coords?.lng) return;

      map.flyTo([coords.lat, coords.lng], 12, { duration: 0.8 });
      setShouldFly(false);
    }, [active, coords, map, setShouldFly]);

    return null;
  }

  return (
    <div className="h-[240px]">
      <MapContainer
        center={coords?.lat && coords?.lng ? [coords.lat, coords.lng] : [28.3949, 84.124]}
        zoom={coords?.lat && coords?.lng ? 12 : 7}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToMarker active={shouldFly} />
        <PickMarker />

        {coords ? (
          <Marker
            position={[coords.lat, coords.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();

                if (!isInsideNepal(p.lat, p.lng)) {
                  const m = "Marker must stay inside Nepal.";
                  setErr(m);
                  showToast("error", m);
                  return;
                }

                setCoords({ lat: p.lat, lng: p.lng });
                setLatInput(String(Number(p.lat).toFixed(7)));
                setLngInput(String(Number(p.lng).toFixed(7)));
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

function TourStatCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_14px_35px_rgba(16,24,40,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_42%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-600">{label}</div>
          <div className="mt-3 text-4xl font-black tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/85 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function FilterBox({ icon, children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      {children}
    </div>
  );
}

function TourListItem({
  row,
  busyId,
  onToggle,
  openEdit,
  openDelete,
  openComplete,
  navigate,
}) {
  const img = toPublicImageUrl(row.image_url) || FALLBACK_TOUR_IMG;
  const busy = busyId === row.agency_tour_id;
  const s = String(row.listing_status || "active").toLowerCase();
  const isCompleted = s === "completed";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:p-5">
        <div className="shrink-0">
          <img
            src={img}
            alt={row.title}
            className="h-44 w-full rounded-[22px] border border-slate-100 object-cover md:h-28 md:w-40"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_TOUR_IMG;
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={row.listing_status} />
                <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
                  {Number(row.bookings_count || 0)} bookings
                </span>
              </div>

              <h3 className="mt-3 truncate text-lg font-bold text-slate-900 md:text-xl">
                {row.title}
              </h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <FiMapPin className="shrink-0" />
                <span className="truncate">{row.location}</span>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Price
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">
                NPR {Number(row.price || 0).toLocaleString("en-NP")}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <IconBtn onClick={() => openEdit(row)} disabled={busy}>
              <FiEdit2 />
              Edit
            </IconBtn>

            <IconBtn tone="danger" onClick={() => openDelete(row)} disabled={busy}>
              <FiTrash2 />
              Delete
            </IconBtn>

            {!isCompleted ? (
              <IconBtn
                tone="neutral"
                onClick={() => openComplete(row)}
                disabled={busy}
              >
                <FiCheckCircle />
                Mark Completed
              </IconBtn>
            ) : null}

            <IconBtn onClick={() => navigate("/agency/bookings")} disabled={busy}>
              <FiEye />
              View Bookings
            </IconBtn>

            <IconBtn onClick={() => navigate("/agency/reviews")} disabled={busy}>
              <FiStar />
              View Reviews
            </IconBtn>

            <button
              type="button"
              onClick={() => onToggle(row)}
              disabled={busy || isCompleted}
              title={
                isCompleted ? "Completed tours cannot be toggled" : "Toggle status"
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {s === "active" ? <FiPauseCircle /> : <FiCheckCircle />}
              {s === "active" ? "Pause" : "Activate"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AgencyManageToursPageContent({ openNotifications }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { unreadCount, refresh } = useAgencyNotifications();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const [busyId, setBusyId] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeRow, setCompleteRow] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  const [coords, setCoords] = useState(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [shouldFly, setShouldFly] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [editInitial, setEditInitial] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2600);
  };

  const params = useMemo(() => ({ q, status, sort }), [q, status, sort]);

  const todayYMD = useMemo(() => toYMD(new Date()), []);
  const startMaxYMD = useMemo(() => toYMD(addMonths(new Date(), 6)), []);
  const endMaxYMD = useMemo(() => toYMD(addMonths(new Date(), 3)), []);

  const isAnyModalOpen = deleteOpen || completeOpen || editOpen;

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isAnyModalOpen]);

  const stats = useMemo(() => {
    const active = rows.filter(
      (r) => String(r.listing_status || "").toLowerCase() === "active"
    ).length;
    const paused = rows.filter(
      (r) => String(r.listing_status || "").toLowerCase() === "paused"
    ).length;
    const totalBookings = rows.reduce(
      (acc, r) => acc + Number(r.bookings_count || 0),
      0
    );

    return {
      total: rows.length,
      active,
      paused,
      totalBookings,
    };
  }, [rows]);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const res = await fetchAgencyManageTours({
        q: params.q,
        status: params.status,
        sort: params.sort,
      });

      setRows(res?.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load tours.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params.q, params.status, params.sort]);

  const onToggle = async (r) => {
    const agencyTourId = r.agency_tour_id;
    const current = String(r.listing_status || "active").toLowerCase();

    if (current === "completed") {
      showToast("error", "Completed tours cannot be toggled.");
      return;
    }

    const next = current === "active" ? "paused" : "active";

    try {
      setBusyId(agencyTourId);
      setErr("");
      await updateAgencyTourStatus(agencyTourId, next);
      await load();
      showToast("success", `Tour set to ${next}`);
    } catch (e) {
      const m = e?.response?.data?.message || "Failed to update status.";
      setErr(m);
      showToast("error", m);
    } finally {
      setBusyId(null);
    }
  };

  const openDelete = (r) => {
    setDeleteRow(r);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setDeleteRow(null);
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;

    const agencyTourId = deleteRow.agency_tour_id;

    try {
      setBusyId(agencyTourId);
      setErr("");
      await deleteAgencyTour(agencyTourId);
      closeDelete();
      await load();
      showToast("success", "Tour deleted");
    } catch (e) {
      const m = e?.response?.data?.message || "Failed to delete tour.";
      setErr(m);
      showToast("error", m);
    } finally {
      setBusyId(null);
    }
  };

  const openComplete = (r) => {
    setCompleteRow(r);
    setCompleteOpen(true);
  };

  const closeComplete = () => {
    setCompleteOpen(false);
    setCompleteRow(null);
  };

  const confirmComplete = async () => {
    if (!completeRow) return;

    const agencyTourId = completeRow.agency_tour_id;

    closeComplete();

    try {
      setBusyId(agencyTourId);
      setErr("");
      await updateAgencyTourStatus(agencyTourId, "completed");
      await load();
      showToast("success", "Tour marked as completed");
    } catch (e) {
      const m = e?.response?.data?.message || "Failed to mark as completed.";
      setErr(m);
      showToast("error", m);
    } finally {
      setBusyId(null);
    }
  };

  const resetEditState = () => {
    setEditRow(null);
    setEditTitle("");
    setEditDesc("");
    setEditType("");
    setEditLocation("");
    setEditPrice("");
    setEditStartDate("");
    setEditEndDate("");
    setEditStatus("active");
    setCoords(null);
    setLatInput("");
    setLngInput("");
    setShouldFly(false);
    setImageFile(null);

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setEditInitial(null);
  };

  const closeEdit = () => {
    setEditOpen(false);
    resetEditState();
  };

  const openEdit = (r) => {
    setErr("");
    setEditRow(r);

    const t = String(r.title || "");
    const d = String(r.long_description || "");
    const ty = String(r.type || "");
    const loc = String(r.location || "");
    const pr = String(r.price ?? "").replace(/\D/g, "").slice(0, 7);
    const st = String(r.listing_status || "active").toLowerCase();

    setEditTitle(t);
    setEditDesc(d);
    setEditType(ty);
    setEditLocation(loc);
    setEditPrice(pr);

    const safeStatus =
      st === "paused" ? "paused" : st === "completed" ? "completed" : "active";
    setEditStatus(safeStatus);

    const dates = splitDatesFromRow(r);
    setEditStartDate(dates.start);
    setEditEndDate(dates.end);

    const la =
      r.latitude !== null && r.latitude !== undefined ? Number(r.latitude) : null;
    const lo =
      r.longitude !== null && r.longitude !== undefined ? Number(r.longitude) : null;

    if (Number.isFinite(la) && Number.isFinite(lo)) {
      setCoords({ lat: la, lng: lo });
      setLatInput(String(la.toFixed(7)));
      setLngInput(String(lo.toFixed(7)));
      setShouldFly(true);
    } else {
      setCoords(null);
      setLatInput("");
      setLngInput("");
      setShouldFly(false);
    }

    setImageFile(null);

    const imgUrl = toPublicImageUrl(r.image_url) || "";
    setPreviewUrl(imgUrl);

    setEditInitial({
      title: normalizeText(t),
      desc: normalizeText(d),
      type: normalizeText(ty),
      location: normalizeText(loc),
      price: String(pr ?? "").trim(),
      start: String(dates.start || ""),
      end: String(dates.end || ""),
      status: safeStatus,
      lat: Number.isFinite(la) ? Number(la).toFixed(7) : "",
      lng: Number.isFinite(lo) ? Number(lo).toFixed(7) : "",
      imageUrl: imgUrl,
    });

    setEditOpen(true);
  };

  function sanitizeDecimal(raw) {
    const s = String(raw || "");
    let out = "";
    let dotUsed = false;

    for (const ch of s) {
      if (ch >= "0" && ch <= "9") {
        out += ch;
        continue;
      }
      if (ch === "." && !dotUsed) {
        out += ".";
        dotUsed = true;
      }
    }

    if (out.startsWith(".")) out = `0${out}`;
    return out;
  }

  const applyLatLngToMap = () => {
    const la = Number(latInput);
    const lo = Number(lngInput);

    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      const m = "Latitude and longitude must be valid numbers.";
      setErr(m);
      showToast("error", m);
      return;
    }

    if (!isInsideNepal(la, lo)) {
      const m = "Latitude/Longitude must be inside Nepal.";
      setErr(m);
      showToast("error", m);
      return;
    }

    setCoords({ lat: la, lng: lo });
    setLatInput(String(Number(la).toFixed(7)));
    setLngInput(String(Number(lo).toFixed(7)));
    setShouldFly(true);
  };

  const onPickImage = (file) => {
    if (!file) return;

    if (
      !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)
    ) {
      const m = "Only PNG/JPG/WEBP allowed.";
      setErr(m);
      showToast("error", m);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      const m = "Image must be max 2MB.";
      setErr(m);
      showToast("error", m);
      return;
    }

    setImageFile(file);

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const canChangeCompletedBack = useMemo(() => {
    if (!editInitial) return true;
    if (String(editInitial.status || "").toLowerCase() !== "completed") return true;
    if (!isValidDateString(editInitial.end)) return false;

    const originalEnd = new Date(`${editInitial.end}T00:00:00`);
    const today = new Date(`${todayYMD}T00:00:00`);

    return originalEnd >= today;
  }, [editInitial, todayYMD]);

  const validateEdit = () => {
    if (!editRow?.agency_tour_id) return "Invalid tour.";
    if (!editTitle.trim()) return "Tour title is required.";
    if (!editDesc.trim()) return "Description is required.";
    if (!editLocation.trim()) return "Location is required.";
    if (!editLocation.toLowerCase().endsWith("nepal")) {
      return "Location must end with 'Nepal'.";
    }
    if (!editType) return "Type is required.";

    const prRaw = String(editPrice ?? "").replace(/\D/g, "");
    if (!prRaw) return "Price must be greater than 0.";
    if (prRaw.length > 7) return "Price must be max 7 digits.";

    const p = Number(prRaw);
    if (!Number.isFinite(p) || p <= 0) return "Price must be greater than 0.";

    if (!editStartDate || !editEndDate) {
      return "Start date and end date are required.";
    }

    if (!isValidDateString(editStartDate)) return "Invalid start date.";
    if (!isValidDateString(editEndDate)) return "Invalid end date.";

    const start = new Date(`${editStartDate}T00:00:00`);
    const end = new Date(`${editEndDate}T00:00:00`);
    const today = new Date(`${todayYMD}T00:00:00`);
    const maxStart = new Date(`${startMaxYMD}T00:00:00`);
    const maxEnd = new Date(`${endMaxYMD}T00:00:00`);

    const initialStatus = String(editInitial?.status || "").toLowerCase();
    const nextStatus = String(editStatus || "").toLowerCase();

    if (
      initialStatus === "completed" &&
      nextStatus !== "completed" &&
      !canChangeCompletedBack
    ) {
      return "Completed tours can only be changed back if the original end date has not passed.";
    }

    if (start < today) return "Start date cannot be in the past.";
    if (start > maxStart) return "Start date must be within 6 months from today.";

    if (end < today) return "End date cannot be in the past.";
    if (end > maxEnd) return "End date must be within 3 months from today.";
    if (end < start) return "End date cannot be earlier than start date.";

    if (
      coords?.lat === null ||
      coords?.lat === undefined ||
      coords?.lng === null ||
      coords?.lng === undefined
    ) {
      return "Please pick location on map or type lat/lng.";
    }

    if (!isInsideNepal(coords.lat, coords.lng)) {
      return "Selected coordinates must be inside Nepal.";
    }

    const st = String(editStatus || "").toLowerCase();
    if (!["active", "paused", "completed"].includes(st)) {
      return "Invalid status.";
    }

    return "";
  };

  const isEditDirty = useMemo(() => {
    if (!editOpen || !editInitial) return false;

    const current = {
      title: normalizeText(editTitle),
      desc: normalizeText(editDesc),
      type: normalizeText(editType),
      location: normalizeText(editLocation),
      price: String(editPrice ?? "").trim(),
      start: String(editStartDate || ""),
      end: String(editEndDate || ""),
      status: String(editStatus || "").toLowerCase(),
      lat:
        coords?.lat !== null && coords?.lat !== undefined
          ? Number(coords.lat).toFixed(7)
          : "",
      lng:
        coords?.lng !== null && coords?.lng !== undefined
          ? Number(coords.lng).toFixed(7)
          : "",
      imageChanged: Boolean(imageFile),
    };

    return (
      current.title !== editInitial.title ||
      current.desc !== editInitial.desc ||
      current.type !== editInitial.type ||
      current.location !== editInitial.location ||
      current.price !== editInitial.price ||
      current.start !== editInitial.start ||
      current.end !== editInitial.end ||
      current.status !== editInitial.status ||
      current.lat !== editInitial.lat ||
      current.lng !== editInitial.lng ||
      current.imageChanged
    );
  }, [
    editOpen,
    editInitial,
    editTitle,
    editDesc,
    editType,
    editLocation,
    editPrice,
    editStartDate,
    editEndDate,
    editStatus,
    coords,
    imageFile,
  ]);

  const saveEdit = async () => {
    if (!editInitial || !editRow?.agency_tour_id) return;

    if (!isEditDirty) {
      showToast("error", "No changes to update.");
      return;
    }

    const msg = validateEdit();
    if (msg) {
      setErr(msg);
      showToast("error", msg);
      return;
    }

    const agencyTourId = editRow.agency_tour_id;

    try {
      setBusyId(agencyTourId);
      setErr("");

      const fd = new FormData();
      fd.append("title", editTitle.trim());
      fd.append("description", editDesc.trim());
      fd.append("location", editLocation.trim());
      fd.append("type", editType);
      fd.append("latitude", String(Number(coords.lat).toFixed(7)));
      fd.append("longitude", String(Number(coords.lng).toFixed(7)));
      fd.append("price", String(String(editPrice ?? "").replace(/\D/g, "")));
      fd.append("start_date", editStartDate);
      fd.append("end_date", editEndDate);
      fd.append("listing_status", String(editStatus).toLowerCase());

      if (imageFile) {
        fd.append("image", imageFile);
      }

      const res = await updateAgencyTour(agencyTourId, fd);

      closeEdit();
      await load();
      showToast("success", res?.message || "Tour updated");
    } catch (e) {
      const m = e?.response?.data?.message || "Failed to update tour.";
      setErr(m);
      showToast("error", m);
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f3faf6_50%,#eef8f1_100%)] p-4 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-[1700px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_left,rgba(59,130,246,0.08),transparent_24%)]" />

            <div className="relative">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Tourism Nepal
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Manage Tours
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="relative grid h-12 w-12 place-items-center rounded-2xl border border-emerald-100 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                    onClick={handleOpenNotifications}
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <FiBell />
                    {Number(unreadCount || 0) > 0 && (
                      <span className="absolute -right-2 -top-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={() => navigate("/agency/tours/new")}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-800 hover:to-emerald-700"
                  >
                    <FiPlus />
                    Add Tour
                  </motion.button>
                </div>
              </div>

              <div
                className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                style={{ perspective: "1200px" }}
              >
                <TourStatCard
                  icon={<FiLayers className="text-slate-700" size={20} />}
                  label="Total Tours"
                  value={stats.total}
                  tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                />
                <TourStatCard
                  icon={<FiCheckCircle className="text-slate-700" size={20} />}
                  label="Active Tours"
                  value={stats.active}
                  tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                />
                <TourStatCard
                  icon={<FiPauseCircle className="text-slate-700" size={20} />}
                  label="Paused Tours"
                  value={stats.paused}
                  tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                />
                <TourStatCard
                  icon={<FiEye className="text-slate-700" size={20} />}
                  label="Total Bookings"
                  value={stats.totalBookings}
                  tint="border-violet-100 bg-gradient-to-br from-violet-50 to-white"
                />
              </div>

              <div className="mt-6 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <FilterBox icon={<FiSearch />} className="w-full xl:flex-[1.25]">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Search Nepal tours..."
                    />
                  </FilterBox>

                  <FilterBox
                    icon={<FiChevronDown />}
                    className="w-full xl:flex-none md:w-[190px]"
                  >
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 pl-4 pr-10 text-[15px] font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </FilterBox>

                  <FilterBox
                    icon={<FiChevronDown />}
                    className="w-full xl:flex-none md:w-[190px]"
                  >
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 pl-4 pr-10 text-[15px] font-semibold text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="oldest">Sort: Oldest</option>
                    </select>
                  </FilterBox>
                </div>
              </div>

              {err ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {err}
                </motion.div>
              ) : null}

              <div className="mt-6">
                {loading ? (
                  <div className="rounded-[30px] border border-white/70 bg-white/80 px-4 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                    <p className="text-sm font-semibold text-slate-500">
                      Loading tours...
                    </p>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="rounded-[30px] border border-white/70 bg-white/80 px-4 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <p className="text-sm font-semibold text-slate-500">
                      No tours found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rows.map((r) => (
                      <TourListItem
                        key={r.agency_tour_id}
                        row={r}
                        busyId={busyId}
                        onToggle={onToggle}
                        openEdit={openEdit}
                        openDelete={openDelete}
                        openComplete={openComplete}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ModalShell
        open={deleteOpen}
        title="Delete tour"
        subtitle={
          deleteRow
            ? `This will remove "${deleteRow.title}" if it has no bookings.`
            : ""
        }
        onClose={busyId ? () => {} : closeDelete}
        busy={Boolean(busyId)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDelete}
              disabled={Boolean(busyId)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={Boolean(busyId)}
              className="h-11 rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="text-sm leading-7 text-slate-700">
          Are you sure you want to delete this tour? This action cannot be undone.
        </div>
        <div className="mt-2 text-xs text-slate-500">
          If this tour already has bookings, deletion will be blocked and you should pause it instead.
        </div>
      </ModalShell>

      <ModalShell
        open={completeOpen}
        title="Mark tour as completed"
        subtitle={
          completeRow ? `Are you sure "${completeRow.title}" is completed?` : ""
        }
        onClose={busyId ? () => {} : closeComplete}
        busy={Boolean(busyId)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeComplete}
              disabled={Boolean(busyId)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmComplete}
              disabled={Boolean(busyId)}
              className="h-11 rounded-2xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
            >
              Yes, Completed
            </button>
          </div>
        }
      >
        <div className="text-sm leading-7 text-slate-700">
          After marking completed, this tour will be treated as finished and cannot be toggled back from this page.
        </div>
      </ModalShell>

      <ModalShell
        open={editOpen}
        title="Edit tour"
        subtitle={editRow ? `Update details for "${editRow.title}".` : ""}
        onClose={busyId ? () => {} : closeEdit}
        busy={Boolean(busyId)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEdit}
              disabled={Boolean(busyId)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveEdit}
              disabled={Boolean(busyId) || !isEditDirty}
              className="h-11 rounded-2xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
              title={!isEditDirty ? "Make a change to enable Save" : "Save changes"}
            >
              <span className="inline-flex items-center gap-2">
                <FiSave />
                Save
              </span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Tour Title
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              placeholder="Enter tour title"
              maxLength={80}
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Description
            </div>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              placeholder="Enter tour description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Price (NPR)
              </div>
              <input
                value={editPrice}
                onChange={(e) => {
                  const v = String(e.target.value || "")
                    .replace(/\D/g, "")
                    .slice(0, 7);
                  setEditPrice(v);
                }}
                maxLength={7}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                placeholder="Enter price"
                inputMode="numeric"
              />
              <div className="mt-1 text-[11px] text-slate-500">
                Digits only • max 7 digits
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Start Date
              </div>
              <input
                type="date"
                value={editStartDate}
                min={todayYMD}
                max={startMaxYMD}
                onKeyDown={blockManualDateInput}
                onPaste={blockManualDateInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditStartDate(v);

                  if (editEndDate && v) {
                    const end = new Date(`${editEndDate}T00:00:00`);
                    const start = new Date(`${v}T00:00:00`);
                    const minEnd = new Date(`${todayYMD}T00:00:00`);
                    const maxEnd = new Date(`${endMaxYMD}T00:00:00`);

                    if (end < minEnd || end > maxEnd || end < start) {
                      setEditEndDate("");
                    }
                  }
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                End Date
              </div>
              <input
                type="date"
                value={editEndDate}
                min={editStartDate || todayYMD}
                max={endMaxYMD}
                onKeyDown={blockManualDateInput}
                onPaste={blockManualDateInput}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-emerald-900/70">
                Location
              </div>
              <select
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select a place</option>
                {NEPAL_PLACES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Type
              </div>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select type</option>
                <option value="Adventure">Adventure</option>
                <option value="Cultural">Cultural</option>
                <option value="Nature">Nature</option>
                <option value="Religious">Religious</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Status
              </div>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option
                  value="active"
                  disabled={
                    String(editInitial?.status || "").toLowerCase() === "completed" &&
                    !canChangeCompletedBack
                  }
                >
                  Active
                </option>
                <option
                  value="paused"
                  disabled={
                    String(editInitial?.status || "").toLowerCase() === "completed" &&
                    !canChangeCompletedBack
                  }
                >
                  Paused
                </option>
                <option value="completed">Completed</option>
              </select>

              {String(editInitial?.status || "").toLowerCase() === "completed" &&
              !canChangeCompletedBack ? (
                <div className="mt-2 text-xs font-medium text-red-600">
                  This completed tour cannot be changed back because its original end date has already passed.
                </div>
              ) : null}

              <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="text-sm font-semibold text-emerald-900">
                  Cover Image
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  <FiUploadCloud />
                  Choose Image
                </button>

                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={previewUrl || FALLBACK_TOUR_IMG}
                    alt="Preview"
                    className="h-[180px] w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_TOUR_IMG;
                    }}
                  />
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  If you do not choose a new image, the current image will remain.
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <FiMapPin />
                  Pick Location on Map
                </div>
                <div className="text-xs text-slate-500">
                  Click map or type lat/lng.
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Latitude
                  </div>
                  <input
                    value={latInput}
                    onChange={(e) => setLatInput(sanitizeDecimal(e.target.value))}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="e.g., 27.6727000"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Longitude
                  </div>
                  <input
                    value={lngInput}
                    onChange={(e) => setLngInput(sanitizeDecimal(e.target.value))}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="e.g., 85.4298000"
                    inputMode="decimal"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyLatLngToMap}
                    className="h-11 w-full rounded-2xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    Set Marker
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
                <LazyNepalMapPicker
                  coords={coords}
                  setCoords={setCoords}
                  setLatInput={setLatInput}
                  setLngInput={setLngInput}
                  setErr={setErr}
                  showToast={showToast}
                  shouldFly={shouldFly}
                  setShouldFly={setShouldFly}
                />

                <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold">Lat:</span>{" "}
                    {coords?.lat !== null && coords?.lat !== undefined
                      ? Number(coords.lat).toFixed(6)
                      : "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Lng:</span>{" "}
                    {coords?.lng !== null && coords?.lng !== undefined
                      ? Number(coords.lng).toFixed(6)
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
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

export default function AgencyManageToursPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyManageToursPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}