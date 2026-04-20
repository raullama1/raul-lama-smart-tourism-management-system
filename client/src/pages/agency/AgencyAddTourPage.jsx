// client/src/pages/agency/AgencyAddTourPage.jsx
import { useMemo, useRef, useState } from "react";
import {
  FiUploadCloud,
  FiMapPin,
  FiSave,
  FiBell,
  FiCalendar,
  FiTag,
  FiMap,
  FiImage,
  FiDollarSign,
  FiCheckCircle,
  FiNavigation,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import { createAgencyTour } from "../../api/agencyToursApi";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200/80 bg-white text-emerald-950"
      : "border-red-200/80 bg-white text-red-950";

  const iconClass =
    type === "success"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[250] sm:right-6 sm:top-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={[
              "pointer-events-auto relative w-[min(92vw,380px)] overflow-hidden rounded-[24px] border px-4 py-4 shadow-[0_18px_55px_rgba(16,24,40,0.16)] backdrop-blur-xl",
              boxClass,
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_30%)]" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-600 transition hover:bg-black/5 hover:text-gray-900"
              aria-label="Close notification"
            >
              ✕
            </button>

            <div className="relative flex items-start gap-3 pr-8">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${iconClass}`}
              >
                <FiCheckCircle size={18} />
              </div>
              <div className="pt-0.5 text-sm font-semibold leading-6">
                {message}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function isInsideNepal(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  return la >= 26.35 && la <= 30.45 && lo >= 80.0 && lo <= 88.3;
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function PickMarker({ value, onChange, onInvalid }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (!isInsideNepal(lat, lng)) {
        if (typeof onInvalid === "function") {
          onInvalid("Please select a location inside Nepal only.");
        }
        return;
      }

      onChange({ lat, lng });
    },
  });

  if (!value) return null;
  return <Marker position={[value.lat, value.lng]} icon={markerIcon} />;
}

function FlyToMarker({ coords, zoom = 12, active = false, onDone }) {
  const map = useMap();
  if (!active) return null;
  if (!coords?.lat || !coords?.lng) return null;

  map.flyTo([coords.lat, coords.lng], zoom, { duration: 0.8 });
  if (typeof onDone === "function") onDone();
  return null;
}

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

function FieldShell({ title, hint, error, icon, children, innerRef }) {
  return (
    <motion.div
      ref={innerRef}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="rounded-[26px] border border-white/70 bg-white/80 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight text-slate-900">
            {title}
          </div>
          {hint ? (
            <div className="mt-1 text-xs font-medium text-slate-500">{hint}</div>
          ) : null}
        </div>
      </div>

      {children}

      {error ? (
        <div className="mt-2 text-xs font-semibold text-red-600">{error}</div>
      ) : null}
    </motion.div>
  );
}

function inputClass(error) {
  return [
    "w-full rounded-2xl border bg-white/95 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400",
    error
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
  ].join(" ");
}

function selectClass(error) {
  return [
    "w-full rounded-2xl border bg-white/95 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition",
    error
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
  ].join(" ");
}

function topCardClass() {
  return "rounded-[28px] border border-white/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl";
}

function AgencyAddTourPageContent({ openNotifications }) {
  const { unreadCount, refresh } = useAgencyNotifications();
  const dropRef = useRef(null);

  const refTitle = useRef(null);
  const refDesc = useRef(null);
  const refPrice = useRef(null);
  const refStartDate = useRef(null);
  const refEndDate = useRef(null);
  const refLocation = useRef(null);
  const refType = useRef(null);
  const refStatus = useRef(null);
  const refMap = useRef(null);
  const refImage = useRef(null);

  const inputTitleRef = useRef(null);
  const inputPriceRef = useRef(null);
  const inputStartRef = useRef(null);
  const inputEndRef = useRef(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [listingStatus, setListingStatus] = useState("");

  const [coords, setCoords] = useState(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [shouldFly, setShouldFly] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [fieldErr, setFieldErr] = useState({
    title: "",
    desc: "",
    price: "",
    startDate: "",
    endDate: "",
    location: "",
    type: "",
    listingStatus: "",
    coords: "",
    image: "",
    lat: "",
    lng: "",
  });

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const nepalCenter = useMemo(() => ({ lat: 28.3949, lng: 84.124 }), []);

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

  const syncCoordsToInputs = (c) => {
    if (!c) {
      setLatInput("");
      setLngInput("");
      return;
    }
    setLatInput(String(Number(c.lat).toFixed(7)));
    setLngInput(String(Number(c.lng).toFixed(7)));
  };

  const setCoordsBoth = (c) => {
    setCoords(c);
    syncCoordsToInputs(c);
    setFieldErr((p) => ({ ...p, coords: "", lat: "", lng: "" }));
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

  const onPickImage = (file) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      showToast("error", "Only PNG/JPG/WEBP allowed.");
      setFieldErr((p) => ({ ...p, image: "Only PNG/JPG/WEBP allowed." }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be max 2MB.");
      setFieldErr((p) => ({ ...p, image: "Image must be max 2MB." }));
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFieldErr((p) => ({ ...p, image: "" }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPickImage(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const applyLatLngToMap = () => {
    const la = Number(latInput);
    const lo = Number(lngInput);

    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      showToast("error", "Latitude and longitude must be valid numbers.");
      setFieldErr((p) => ({
        ...p,
        lat: "Enter a valid latitude.",
        lng: "Enter a valid longitude.",
        coords: "Pick a location inside Nepal.",
      }));
      return;
    }

    if (!isInsideNepal(la, lo)) {
      showToast("error", "Latitude/Longitude must be inside Nepal.");
      setFieldErr((p) => ({
        ...p,
        lat: "Must be inside Nepal.",
        lng: "Must be inside Nepal.",
        coords: "Pick a location inside Nepal.",
      }));
      return;
    }

    setCoordsBoth({ lat: la, lng: lo });
    setShouldFly(true);
  };

  const validateAll = () => {
    const next = {
      title: "",
      desc: "",
      price: "",
      startDate: "",
      endDate: "",
      location: "",
      type: "",
      listingStatus: "",
      coords: "",
      image: "",
      lat: "",
      lng: "",
    };

    if (!title.trim()) next.title = "Required";
    if (!desc.trim()) next.desc = "Required";

    const p = Number(price);
    if (!price || !Number.isFinite(p) || p <= 0) {
      next.price = "Enter a valid price";
    }

    if (!startDate) {
      next.startDate = "Required";
    } else {
      const start = new Date(startDate);
      const today = new Date(todayYMD);
      const max = new Date(startMaxYMD);
      if (start < today) next.startDate = "Start date cannot be in the past";
      else if (start > max)
        next.startDate = "Start date must be within 3 months from today";
    }

    if (!endDate) {
      next.endDate = "Required";
    } else if (startDate && isValidDateString(startDate)) {
      const end = new Date(endDate);
      const minEnd = new Date(endMinYMD);
      const maxEnd = new Date(endMaxYMD);
      if (end < minEnd)
        next.endDate = "End date cannot be earlier than start date";
      else if (end > maxEnd)
        next.endDate = "End date must be within 3 months after start";
    }

    const loc = String(location || "").trim();
    if (!loc) next.location = "Required";
    else if (!loc.toLowerCase().endsWith("nepal"))
      next.location = "Must end with 'Nepal'";

    if (!type) next.type = "Required";

    const st = String(listingStatus || "").toLowerCase();
    if (!st) next.listingStatus = "Required";
    else if (!["active", "paused"].includes(st))
      next.listingStatus = "Invalid status";

    if (!coords?.lat || !coords?.lng) next.coords = "Pick a location on the map";
    else if (!isInsideNepal(coords.lat, coords.lng))
      next.coords = "Must be inside Nepal";

    if (!imageFile) next.image = "Cover image is required";

    const ok = Object.values(next).every((v) => !v);
    return { ok, next };
  };

  const scrollToNode = (node) => {
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToFirstError = (nextErrors) => {
    const order = [
      { key: "title", boxRef: refTitle, focusRef: inputTitleRef },
      { key: "desc", boxRef: refDesc },
      { key: "price", boxRef: refPrice, focusRef: inputPriceRef },
      { key: "startDate", boxRef: refStartDate, focusRef: inputStartRef },
      { key: "endDate", boxRef: refEndDate, focusRef: inputEndRef },
      { key: "location", boxRef: refLocation },
      { key: "type", boxRef: refType },
      { key: "listingStatus", boxRef: refStatus },
      { key: "coords", boxRef: refMap },
      { key: "image", boxRef: refImage },
    ];

    const first = order.find((it) => Boolean(nextErrors?.[it.key]));
    if (!first) return;

    window.requestAnimationFrame(() => {
      scrollToNode(first.boxRef.current);
      if (first.focusRef?.current) {
        try {
          first.focusRef.current.focus();
        } catch {}
      }
    });
  };

  const handleSave = async () => {
    const { ok, next } = validateAll();
    setFieldErr(next);

    if (!ok) {
      showToast("error", "All fields are required.");
      scrollToFirstError(next);
      return;
    }

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", desc.trim());
      fd.append("starting_price", String(price));
      fd.append("location", location.trim());
      fd.append("type", type);
      fd.append("listing_status", String(listingStatus).toLowerCase());
      fd.append("latitude", String(coords.lat));
      fd.append("longitude", String(coords.lng));
      fd.append("start_date", startDate);
      fd.append("end_date", endDate);
      fd.append("image", imageFile);

      await createAgencyTour(fd);

      showToast("success", "Tour saved successfully.");

      window.requestAnimationFrame(() => {
        scrollToTop();
      });

      setTitle("");
      setDesc("");
      setPrice("");
      setStartDate("");
      setEndDate("");
      setLocation("");
      setType("");
      setListingStatus("");
      setCoords(null);
      setLatInput("");
      setLngInput("");
      setShouldFly(false);
      setImageFile(null);
      setPreviewUrl("");
      setFieldErr({
        title: "",
        desc: "",
        price: "",
        startDate: "",
        endDate: "",
        location: "",
        type: "",
        listingStatus: "",
        coords: "",
        image: "",
        lat: "",
        lng: "",
      });
    } catch (e) {
      const status = e?.response?.status;

      if (status === 409) {
        showToast(
          "error",
          "This tour already exists. Please add it from 'Add Existing Tour'."
        );
        return;
      }

      const msg = e?.response?.data?.message || "Failed to save tour.";
      showToast("error", msg);
    } finally {
      setSaving(false);
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
      <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.76))] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_35%,rgba(255,255,255,0.12)_70%,transparent)]" />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`${topCardClass()} sticky top-3 z-20 p-4 sm:p-5`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Tourism Nepal
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Add New Tour
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Create a polished tour listing with dates, location, map marker,
                  and cover image.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
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

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.28)] transition hover:from-emerald-800 hover:to-emerald-700 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <FiSave />
                    {saving ? "Saving..." : "Save Tour"}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.04 }}
                className="grid grid-cols-1 gap-5"
                style={{ perspective: "1200px" }}
              >
                <FieldShell
                  title="Tour Title"
                  hint="Give your package a clean and attractive title."
                  error={fieldErr.title}
                  icon={<FiTag size={18} />}
                  innerRef={refTitle}
                >
                  <input
                    ref={inputTitleRef}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (e.target.value.trim()) {
                        setFieldErr((p) => ({ ...p, title: "" }));
                      }
                    }}
                    className={inputClass(fieldErr.title)}
                    placeholder="Enter tour title"
                  />
                </FieldShell>

                <FieldShell
                  title="Description"
                  hint="Write a short and clear overview for travelers."
                  error={fieldErr.desc}
                  icon={<FiMap size={18} />}
                  innerRef={refDesc}
                >
                  <textarea
                    value={desc}
                    onChange={(e) => {
                      setDesc(e.target.value);
                      if (e.target.value.trim()) {
                        setFieldErr((p) => ({ ...p, desc: "" }));
                      }
                    }}
                    rows={6}
                    className={`${inputClass(fieldErr.desc)} resize-none`}
                    placeholder="Enter tour description"
                  />
                </FieldShell>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <FieldShell
                    title="Price"
                    hint="Starting price in NPR."
                    error={fieldErr.price}
                    icon={<FiDollarSign size={18} />}
                    innerRef={refPrice}
                  >
                    <input
                      ref={inputPriceRef}
                      value={price}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 7);
                        setPrice(v);
                        if (v) setFieldErr((p) => ({ ...p, price: "" }));
                      }}
                      maxLength={7}
                      className={inputClass(fieldErr.price)}
                      placeholder="Enter price"
                      inputMode="numeric"
                    />
                  </FieldShell>

                  <FieldShell
                    title="Start Date"
                    hint="Pick a valid start date."
                    error={fieldErr.startDate}
                    icon={<FiCalendar size={18} />}
                    innerRef={refStartDate}
                  >
                    <input
                      ref={inputStartRef}
                      type="date"
                      value={startDate}
                      min={todayYMD}
                      max={startMaxYMD}
                      onKeyDown={blockManualDateInput}
                      onPaste={blockManualDateInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setStartDate(v);
                        setFieldErr((p) => ({ ...p, startDate: "" }));

                        if (v && endDate) {
                          const end = new Date(endDate);
                          const minEnd = new Date(v);
                          const maxEnd = new Date(toYMD(addMonths(new Date(v), 3)));
                          if (end < minEnd || end > maxEnd) setEndDate("");
                        }
                      }}
                      className={inputClass(fieldErr.startDate)}
                    />
                  </FieldShell>

                  <FieldShell
                    title="End Date"
                    hint="Choose based on start date."
                    error={fieldErr.endDate}
                    icon={<FiCalendar size={18} />}
                    innerRef={refEndDate}
                  >
                    <input
                      ref={inputEndRef}
                      type="date"
                      value={endDate}
                      min={endMinYMD || undefined}
                      max={endMaxYMD || undefined}
                      disabled={!startDate}
                      onKeyDown={blockManualDateInput}
                      onPaste={blockManualDateInput}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setFieldErr((p) => ({ ...p, endDate: "" }));
                      }}
                      className={[
                        inputClass(fieldErr.endDate),
                        !startDate ? "cursor-not-allowed bg-slate-50 text-slate-500" : "",
                      ].join(" ")}
                    />
                  </FieldShell>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.08 }}
                className="grid grid-cols-1 gap-5 md:grid-cols-3"
                style={{ perspective: "1200px" }}
              >
                <FieldShell
                  title="Location"
                  hint="Pick a place in Nepal."
                  error={fieldErr.location}
                  icon={<FiMapPin size={18} />}
                  innerRef={refLocation}
                >
                  <select
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (e.target.value) {
                        setFieldErr((p) => ({ ...p, location: "" }));
                      }
                    }}
                    className={selectClass(fieldErr.location)}
                  >
                    <option value="">Select a place</option>
                    {NEPAL_PLACES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <FieldShell
                  title="Type"
                  hint="Choose package category."
                  error={fieldErr.type}
                  icon={<FiTag size={18} />}
                  innerRef={refType}
                >
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (e.target.value) setFieldErr((p) => ({ ...p, type: "" }));
                    }}
                    className={selectClass(fieldErr.type)}
                  >
                    <option value="">Select type</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Nature">Nature</option>
                    <option value="Religious">Religious</option>
                  </select>
                </FieldShell>

                <FieldShell
                  title="Status"
                  hint="Control listing availability."
                  error={fieldErr.listingStatus}
                  icon={<FiCheckCircle size={18} />}
                  innerRef={refStatus}
                >
                  <select
                    value={listingStatus}
                    onChange={(e) => {
                      setListingStatus(e.target.value);
                      if (e.target.value) {
                        setFieldErr((p) => ({ ...p, listingStatus: "" }));
                      }
                    }}
                    className={selectClass(fieldErr.listingStatus)}
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </FieldShell>
              </motion.div>

              <motion.div
                ref={refMap}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.12 }}
                whileHover={{ y: -2, rotateX: 1, rotateY: -1 }}
                style={{ transformStyle: "preserve-3d" }}
                className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-5"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <FiNavigation size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Pick Location on Map
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        Click on the map, drag the marker, or set coordinates manually.
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    Nepal only
                  </div>
                </div>

                {fieldErr.coords ? (
                  <div className="mt-3 text-xs font-semibold text-red-600">
                    {fieldErr.coords}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Latitude
                    </div>
                    <input
                      value={latInput}
                      onChange={(e) => setLatInput(sanitizeDecimal(e.target.value))}
                      className={inputClass(fieldErr.lat)}
                      placeholder="e.g., 27.6727000"
                      inputMode="decimal"
                    />
                    {fieldErr.lat ? (
                      <div className="mt-2 text-xs font-semibold text-red-600">
                        {fieldErr.lat}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Longitude
                    </div>
                    <input
                      value={lngInput}
                      onChange={(e) => setLngInput(sanitizeDecimal(e.target.value))}
                      className={inputClass(fieldErr.lng)}
                      placeholder="e.g., 85.4298000"
                      inputMode="decimal"
                    />
                    {fieldErr.lng ? (
                      <div className="mt-2 text-xs font-semibold text-red-600">
                        {fieldErr.lng}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      type="button"
                      onClick={applyLatLngToMap}
                      className="h-[48px] w-full rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                    >
                      Set Marker
                    </motion.button>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-inner">
                  <div className="h-[280px] sm:h-[340px]">
                    <MapContainer
                      center={[nepalCenter.lat, nepalCenter.lng]}
                      zoom={7}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <FlyToMarker
                        coords={coords}
                        zoom={12}
                        active={shouldFly}
                        onDone={() => setShouldFly(false)}
                      />

                      {coords ? (
                        <Marker
                          position={[coords.lat, coords.lng]}
                          icon={markerIcon}
                          draggable
                          eventHandlers={{
                            dragend: (e) => {
                              const p = e.target.getLatLng();
                              if (!isInsideNepal(p.lat, p.lng)) {
                                showToast("error", "Marker must stay inside Nepal.");
                                setFieldErr((prev) => ({
                                  ...prev,
                                  coords: "Pick a location inside Nepal.",
                                }));
                                return;
                              }
                              setCoordsBoth({ lat: p.lat, lng: p.lng });
                            },
                          }}
                        />
                      ) : null}

                      <PickMarker
                        value={coords}
                        onChange={(c) => {
                          setShouldFly(false);
                          setCoordsBoth(c);
                        }}
                        onInvalid={(msg) => {
                          showToast("error", msg);
                          setFieldErr((p) => ({ ...p, coords: msg }));
                        }}
                      />
                    </MapContainer>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-emerald-100 bg-emerald-50/40 px-4 py-3 text-xs font-medium text-slate-600">
                    <div className="rounded-full bg-white px-3 py-1.5 ring-1 ring-emerald-100">
                      <span className="font-semibold text-slate-800">Lat:</span>{" "}
                      {coords?.lat ? Number(coords.lat).toFixed(6) : "—"}
                    </div>
                    <div className="rounded-full bg-white px-3 py-1.5 ring-1 ring-emerald-100">
                      <span className="font-semibold text-slate-800">Lng:</span>{" "}
                      {coords?.lng ? Number(coords.lng).toFixed(6) : "—"}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-5">
              <motion.div
                ref={refImage}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.16 }}
                whileHover={{ y: -2, rotateX: 1, rotateY: 1 }}
                style={{ transformStyle: "preserve-3d" }}
                className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <FiImage size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Upload Cover Image
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      PNG/JPG/WEBP up to 2MB.
                    </div>
                  </div>
                </div>

                <div
                  ref={dropRef}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() =>
                    document.getElementById("tour_image_input")?.click()
                  }
                  className={[
                    "mt-4 cursor-pointer rounded-[26px] border-2 border-dashed bg-[linear-gradient(180deg,rgba(236,253,245,0.65),rgba(255,255,255,0.95))] p-5 transition",
                    fieldErr.image
                      ? "border-red-300"
                      : "border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/70",
                  ].join(" ")}
                >
                  <input
                    id="tour_image_input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => onPickImage(e.target.files?.[0])}
                  />

                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                        <FiUploadCloud size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Drag & drop image here, or click to choose
                        </div>
                        <div className="mt-1 text-xs font-medium text-slate-500">
                          Best results with a clear horizontal image.
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100">
                      {imageFile ? "Selected" : "No file"}
                    </div>
                  </div>

                  {fieldErr.image ? (
                    <div className="mt-3 text-xs font-semibold text-red-600">
                      {fieldErr.image}
                    </div>
                  ) : null}

                  {previewUrl ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white"
                    >
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-[220px] w-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <div className="mt-4 grid h-[220px] place-items-center rounded-[24px] border border-dashed border-emerald-200 bg-white/70 text-center">
                      <div>
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <FiImage size={22} />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-700">
                          Image preview will appear here
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.2 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"
                style={{ perspective: "1200px" }}
              >
                <motion.div
                  whileHover={{ y: -3, rotateX: 1.5, rotateY: -1.5 }}
                  className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-[0_14px_34px_rgba(5,150,105,0.08)]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="text-sm font-semibold text-slate-600">
                    Map Ready
                  </div>
                  <div className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                    {coords ? "Yes" : "No"}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Marker selection inside Nepal
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3, rotateX: 1.5, rotateY: 1.5 }}
                  className="rounded-[26px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-[0_14px_34px_rgba(14,165,233,0.08)]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="text-sm font-semibold text-slate-600">
                    Cover Image
                  </div>
                  <div className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                    {imageFile ? "Added" : "Missing"}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Upload required before saving
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: 0.24 }}
                className={`${topCardClass()} p-4`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Final Step
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      Review details and save the tour listing.
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-11 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(5,150,105,0.28)] transition hover:from-emerald-800 hover:to-emerald-700 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiSave />
                      {saving ? "Saving..." : "Save Tour"}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </>
  );
}

export default function AgencyAddTourPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyAddTourPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}