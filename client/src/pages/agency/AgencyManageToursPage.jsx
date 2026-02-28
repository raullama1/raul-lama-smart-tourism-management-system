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
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import {
  deleteAgencyTour,
  fetchAgencyManageTours,
  updateAgencyTour,
  updateAgencyTourStatus,
} from "../../api/agencyToursApi";
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

/* ---------------- Toast (same style as TouristProfilePage) ---------------- */
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

function badgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (s === "paused") return "bg-amber-50 text-amber-800 border-amber-100";
  if (s === "completed") return "bg-sky-50 text-sky-800 border-sky-100";
  return "bg-gray-50 text-gray-800 border-gray-100";
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold",
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
      ? "border-red-200 text-red-700 hover:bg-red-50"
      : tone === "neutral"
      ? "border-gray-200 text-gray-900 hover:bg-gray-50"
      : "border-emerald-200 text-emerald-900 hover:bg-emerald-50";

  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold transition disabled:opacity-60",
        cls,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ModalShell (scrollable body + max height) */
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
        <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white shadow-xl border border-emerald-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-emerald-100 flex items-start justify-between gap-3 shrink-0">
            <div>
              <div className="text-base font-semibold text-gray-900">
                {title}
              </div>
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

function isInsideNepal(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  return la >= 26.35 && la <= 30.45 && lo >= 80.0 && lo <= 88.3;
}

function splitDates(availableDates) {
  const raw = String(availableDates || "");
  const [a, b] = raw.split("|");
  return { start: a ? a.trim() : "", end: b ? b.trim() : "" };
}

function normalizeText(v) {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/* ---- Date helpers (same as AgencyAddTourPage) ---- */
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

/**
 * Lazy-loaded map picker:
 * Leaflet + react-leaflet are imported only when this component renders (Edit modal open)
 */
function LazyNepalMapPicker({
  coords,
  setCoords,
  latInput,
  setLatInput,
  lngInput,
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
      } catch (e) {
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
      <div className="h-[220px] grid place-items-center text-sm text-gray-600">
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
          const m = "Please select a location inside Nepal only.";
          setErr(m);
          showToast("error", m);
          return;
        }

        setCoords({ lat, lng });
        setLatInput(String(Number(lat).toFixed(7)));
        setLngInput(String(Number(lng).toFixed(7)));
      },
    });

    if (!coords) return null;
    return <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />;
  }

  function FlyToMarker({ active }) {
    const map = useMap();
    if (!active) return null;
    if (!coords?.lat || !coords?.lng) return null;

    map.flyTo([coords.lat, coords.lng], 12, { duration: 0.8 });
    setShouldFly(false);
    return null;
  }

  return (
    <div className="h-[220px]">
      <MapContainer
        center={[28.3949, 84.124]}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToMarker active={shouldFly} />

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

        <PickMarker />
      </MapContainer>
    </div>
  );
}

export default function AgencyManageToursPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

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

  /* Baseline values to detect changes in edit modal */
  const [editInitial, setEditInitial] = useState(null);

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const params = useMemo(() => ({ q, status, sort }), [q, status, sort]);

  /* ---- Calendar rules (same as Add Tour) ---- */
  const todayYMD = useMemo(() => toYMD(new Date()), []);
  const startMaxYMD = useMemo(() => toYMD(addMonths(new Date(), 3)), []);

  const endMinYMD = useMemo(() => {
    if (!isValidDateString(editStartDate)) return "";
    return toYMD(addMonths(new Date(editStartDate), 1));
  }, [editStartDate]);

  const endMaxYMD = useMemo(() => {
    if (!isValidDateString(editStartDate)) return "";
    return toYMD(addMonths(new Date(editStartDate), 3));
  }, [editStartDate]);

  /* Shared grid for header + rows to keep perfect alignment */
  const TABLE_GRID =
    "grid grid-cols-[120px_minmax(0,1.8fr)_125px_160px_110px_360px]";

  /* Consistent left alignment for all columns */
  const CELL_LEFT = "flex items-center justify-start";
  const HEADER_LEFT = "text-left";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
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

    const dates = splitDates(r.available_dates);
    setEditStartDate(dates.start);
    setEditEndDate(dates.end);

    const la =
      r.latitude !== null && r.latitude !== undefined ? Number(r.latitude) : null;
    const lo =
      r.longitude !== null && r.longitude !== undefined
        ? Number(r.longitude)
        : null;

    if (Number.isFinite(la) && Number.isFinite(lo)) {
      setCoords({ lat: la, lng: lo });
      setLatInput(String(la.toFixed(7)));
      setLngInput(String(lo.toFixed(7)));
    } else {
      setCoords(null);
      setLatInput("");
      setLngInput("");
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

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const validateEdit = () => {
    if (!editRow?.agency_tour_id) return "Invalid tour.";
    if (!editTitle.trim()) return "Tour title is required.";
    if (!editDesc.trim()) return "Description is required.";
    if (!editLocation.trim()) return "Location is required.";
    if (!editLocation.toLowerCase().endsWith("nepal"))
      return "Location must end with 'Nepal'.";
    if (!editType) return "Type is required.";

    const prRaw = String(editPrice ?? "").replace(/\D/g, "");
    if (!prRaw) return "Price must be greater than 0.";
    if (prRaw.length > 7) return "Price must be max 7 digits.";

    const p = Number(prRaw);
    if (!Number.isFinite(p) || p <= 0) return "Price must be greater than 0.";

    if (!editStartDate || !editEndDate)
      return "Start date and end date are required.";

    if (!isValidDateString(editStartDate)) return "Invalid start date.";
    if (!isValidDateString(editEndDate)) return "Invalid end date.";

    const start = new Date(editStartDate);
    const today = new Date(todayYMD);
    const maxStart = new Date(startMaxYMD);

    if (start < today) return "Start date cannot be in the past.";
    if (start > maxStart)
      return "Start date must be within 3 months from today.";

    const end = new Date(editEndDate);
    const minEnd = new Date(endMinYMD);
    const maxEnd = new Date(endMaxYMD);

    if (end < minEnd) return "End date must be at least 1 month after start.";
    if (end > maxEnd)
      return "End date must be within 3 months after start.";

    if (!coords?.lat || !coords?.lng)
      return "Please pick location on map or type lat/lng.";
    if (!isInsideNepal(coords.lat, coords.lng))
      return "Selected coordinates must be inside Nepal.";

    const st = String(editStatus || "").toLowerCase();
    if (!["active", "paused", "completed"].includes(st))
      return "Invalid status.";

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
      lat: coords?.lat ? Number(coords.lat).toFixed(7) : "",
      lng: coords?.lng ? Number(coords.lng).toFixed(7) : "",
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
      fd.append("latitude", String(coords.lat));
      fd.append("longitude", String(coords.lng));
      fd.append("price", String(String(editPrice ?? "").replace(/\D/g, "")));
      fd.append("start_date", editStartDate);
      fd.append("end_date", editEndDate);
      fd.append("listing_status", String(editStatus).toLowerCase());
      if (imageFile) fd.append("image", imageFile);

      await updateAgencyTour(agencyTourId, fd);

      closeEdit();
      await load();
      showToast("success", "Tour updated");
    } catch (e) {
      const m = e?.response?.data?.message || "Failed to update tour.";
      setErr(m);
      showToast("error", m);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AgencyLayout>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">Manage Tours</div>
            <div className="text-xs text-gray-500 mt-1">
              All tours limited to Nepal. View, edit, and manage your listings.
            </div>
          </div>

          <button
            type="button"
            className="relative h-10 w-10 rounded-xl border border-emerald-100 bg-white grid place-items-center text-emerald-900 hover:bg-emerald-50"
            onClick={() => {}}
          >
            <FiBell />
            <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold grid place-items-center">
              3
            </span>
          </button>
        </div>

        <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Search Nepal tours..."
              />
            </div>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>

          <button
            type="button"
            onClick={() => navigate("/agency/tours/new")}
            className="h-11 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            <span className="inline-flex items-center gap-2">
              <FiPlus /> Add Tour
            </span>
          </button>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100">
          {/* Header: enforce left alignment to match rows */}
          <div
            className={[
              TABLE_GRID,
              "gap-0 bg-emerald-50/60 border-b border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-900/80",
            ].join(" ")}
          >
            <div className={HEADER_LEFT}>Image</div>
            <div className={HEADER_LEFT}>Tour Name</div>
            <div className={HEADER_LEFT}>Price (NPR)</div>
            <div className={HEADER_LEFT}>Status</div>
            <div className={HEADER_LEFT}>Bookings</div>
            <div className={HEADER_LEFT}>Actions</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-sm text-gray-600">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-sm text-gray-600">No tours found.</div>
          ) : (
            <div className="divide-y divide-emerald-100">
              {rows.map((r) => {
                const img = toPublicImageUrl(r.image_url) || FALLBACK_TOUR_IMG;
                const busy = busyId === r.agency_tour_id;
                const s = String(r.listing_status || "active").toLowerCase();
                const isCompleted = s === "completed";

                return (
                  <div
                    key={r.agency_tour_id}
                    className={[TABLE_GRID, "items-center px-4 py-4"].join(" ")}
                  >
                    {/* Column alignment: keep every cell left-aligned for consistent start */}
                    <div className={CELL_LEFT}>
                      <img
                        src={img}
                        alt={r.title}
                        className="h-16 w-24 rounded-xl object-cover border border-gray-100"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_TOUR_IMG;
                        }}
                      />
                    </div>

                    <div className="pr-4 min-w-0">
                      <div className="text-sm font-bold text-gray-900 leading-tight truncate">
                        {r.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {r.location}
                      </div>
                    </div>

                    <div className={[CELL_LEFT, "text-sm font-bold text-gray-900 tabular-nums"].join(" ")}>
                      NPR {Number(r.price || 0).toLocaleString("en-NP")}
                    </div>

                    <div className={CELL_LEFT}>
                      <button
                        type="button"
                        onClick={() => onToggle(r)}
                        disabled={busy || isCompleted}
                        className="text-left"
                        title={
                          isCompleted
                            ? "Completed tours cannot be toggled"
                            : "Toggle status"
                        }
                      >
                        <StatusPill status={r.listing_status} />
                      </button>
                    </div>

                    <div className={CELL_LEFT}>
                      <span className="inline-flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 tabular-nums">
                        {Number(r.bookings_count || 0)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-start">
                      <IconBtn onClick={() => openEdit(r)} disabled={busy}>
                        <FiEdit2 />
                        Edit
                      </IconBtn>

                      <IconBtn
                        tone="danger"
                        onClick={() => openDelete(r)}
                        disabled={busy}
                      >
                        <FiTrash2 />
                        Delete
                      </IconBtn>

                      {!isCompleted ? (
                        <IconBtn
                          tone="neutral"
                          onClick={() => openComplete(r)}
                          disabled={busy}
                        >
                          <FiCheckCircle />
                          Mark Completed
                        </IconBtn>
                      ) : null}

                      <IconBtn
                        onClick={() => navigate("/agency/bookings")}
                        disabled={busy}
                      >
                        View Bookings
                      </IconBtn>

                      <IconBtn
                        onClick={() => navigate("/agency/reviews")}
                        disabled={busy}
                      >
                        View Reviews
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
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
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={Boolean(busyId)}
              className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          Are you sure you want to delete this tour? This action cannot be
          undone.
        </div>
        <div className="mt-2 text-xs text-gray-500">
          If this tour already has bookings, deletion will be blocked and you
          should pause it instead.
        </div>
      </ModalShell>

      {/* Completed Confirmation Modal */}
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
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmComplete}
              disabled={Boolean(busyId)}
              className="h-10 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
            >
              Yes, Completed
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          After marking completed, this tour will be treated as finished and
          cannot be toggled back from this page.
        </div>
      </ModalShell>

      {/* Edit Modal */}
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
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveEdit}
              disabled={Boolean(busyId) || !isEditDirty}
              className="h-10 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
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
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Tour Title
            </div>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter tour description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter price"
                inputMode="numeric"
              />
              <div className="mt-1 text-[11px] text-gray-500">
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

                  if (v && editEndDate) {
                    const end = new Date(editEndDate);
                    const minEnd = new Date(toYMD(addMonths(new Date(v), 1)));
                    const maxEnd = new Date(toYMD(addMonths(new Date(v), 3)));
                    if (end < minEnd || end > maxEnd) setEditEndDate("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                End Date
              </div>
              <input
                type="date"
                value={editEndDate}
                min={endMinYMD || undefined}
                max={endMaxYMD || undefined}
                disabled={!editStartDate}
                onKeyDown={blockManualDateInput}
                onPaste={blockManualDateInput}
                onChange={(e) => setEditEndDate(e.target.value)}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500",
                  !editStartDate
                    ? "bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200"
                    : "border-gray-200",
                ].join(" ")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-emerald-900/70">
                Location (Nepal only)
              </div>
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Pokhara, Nepal"
                maxLength={80}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Type
              </div>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select type</option>
                <option value="Adventure">Adventure</option>
                <option value="Cultural">Cultural</option>
                <option value="Nature">Nature</option>
                <option value="Religious">Religious</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Status
              </div>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <FiMapPin />
                  Pick Location on Map
                </div>
                <div className="text-xs text-gray-600">
                  Click map or type lat/lng.
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-700">
                    Latitude
                  </div>
                  <input
                    value={latInput}
                    onChange={(e) =>
                      setLatInput(sanitizeDecimal(e.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 27.6727000"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700">
                    Longitude
                  </div>
                  <input
                    value={lngInput}
                    onChange={(e) =>
                      setLngInput(sanitizeDecimal(e.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 85.4298000"
                    inputMode="decimal"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyLatLngToMap}
                    className="w-full h-[42px] rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    Set Marker from Lat/Lng
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
                <LazyNepalMapPicker
                  coords={coords}
                  setCoords={setCoords}
                  latInput={latInput}
                  setLatInput={setLatInput}
                  lngInput={lngInput}
                  setLngInput={setLngInput}
                  setErr={setErr}
                  showToast={showToast}
                  shouldFly={shouldFly}
                  setShouldFly={setShouldFly}
                />

                <div className="px-4 py-3 text-xs text-gray-600 flex flex-wrap gap-3">
                  <div>
                    <span className="font-semibold">Lat:</span>{" "}
                    {coords?.lat ? Number(coords.lat).toFixed(6) : "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Lng:</span>{" "}
                    {coords?.lng ? Number(coords.lng).toFixed(6) : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
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
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              <FiUploadCloud />
              Choose Image
            </button>

            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100">
              <img
                src={previewUrl || FALLBACK_TOUR_IMG}
                alt="Preview"
                className="w-full h-[180px] object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_TOUR_IMG;
                }}
              />
            </div>

            <div className="mt-2 text-xs text-gray-600">
              If you do not choose a new image, the current image will remain.
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
    </AgencyLayout>
  );
}