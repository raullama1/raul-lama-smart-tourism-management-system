// client/src/pages/agency/AgencyAddTourPage.jsx
import { useMemo, useRef, useState } from "react";
import { FiUploadCloud, FiMapPin, FiSave } from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { createAgencyTour } from "../../api/agencyToursApi";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

/* Toast (same style as other pages) */
function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[250] pointer-events-none">
      <div
        className={[
          "pointer-events-auto w-[340px] rounded-2xl border px-4 py-3 shadow-lg",
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

/* Nepal bounding box */
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
        if (typeof onInvalid === "function") onInvalid("Please select a location inside Nepal only.");
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

/* ---- Date helpers ---- */
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

/* Block manual typing/paste in date input (force calendar picker only) */
function blockManualDateInput(e) {
  if (e.type === "keydown" && e.key === "Tab") return;
  e.preventDefault();
}

export default function AgencyAddTourPage() {
  const dropRef = useRef(null);

  /* Refs used for auto-scroll to first invalid field */
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

  /* Optional refs for focusing inputs */
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

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

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
    return toYMD(addMonths(new Date(startDate), 1));
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
    if (!price || !Number.isFinite(p) || p <= 0) next.price = "Enter a valid price";

    if (!startDate) next.startDate = "Required";
    else {
      const start = new Date(startDate);
      const today = new Date(todayYMD);
      const max = new Date(startMaxYMD);
      if (start < today) next.startDate = "Start date cannot be in the past";
      else if (start > max) next.startDate = "Start date must be within 3 months from today";
    }

    if (!endDate) next.endDate = "Required";
    else if (startDate && isValidDateString(startDate)) {
      const end = new Date(endDate);
      const minEnd = new Date(endMinYMD);
      const maxEnd = new Date(endMaxYMD);
      if (end < minEnd) next.endDate = "End date must be at least 1 month after start";
      else if (end > maxEnd) next.endDate = "End date must be within 3 months after start";
    }

    const loc = String(location || "").trim();
    if (!loc) next.location = "Required";
    else if (!loc.toLowerCase().endsWith("nepal")) next.location = "Must end with 'Nepal'";

    if (!type) next.type = "Required";

    const st = String(listingStatus || "").toLowerCase();
    if (!st) next.listingStatus = "Required";
    else if (!["active", "paused"].includes(st)) next.listingStatus = "Invalid status";

    if (!coords?.lat || !coords?.lng) next.coords = "Pick a location on the map";
    else if (!isInsideNepal(coords.lat, coords.lng)) next.coords = "Must be inside Nepal";

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
        } catch {
          // ignore focus errors
        }
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
        showToast("error", "This tour already exists. Please add it from 'Add Existing Tour'.");
        return;
      }

      const msg = e?.response?.data?.message || "Failed to save tour.";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AgencyLayout>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">Add Tour</div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <FiSave />
              {saving ? "Saving..." : "Save Tour"}
            </span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div ref={refTitle}>
            <div className="text-sm font-semibold text-emerald-900/70">Tour Title</div>
            <input
              ref={inputTitleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setFieldErr((p) => ({ ...p, title: "" }));
              }}
              className={[
                "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2",
                fieldErr.title ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
              ].join(" ")}
              placeholder="Enter tour title"
            />
            {fieldErr.title ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.title}</div> : null}
          </div>

          <div ref={refDesc}>
            <div className="text-sm font-semibold text-emerald-900/70">Description</div>
            <textarea
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (e.target.value.trim()) setFieldErr((p) => ({ ...p, desc: "" }));
              }}
              rows={4}
              className={[
                "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2",
                fieldErr.desc ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
              ].join(" ")}
              placeholder="Enter tour description"
            />
            {fieldErr.desc ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.desc}</div> : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div ref={refPrice}>
              <div className="text-sm font-semibold text-emerald-900/70">Price (NPR)</div>
              <input
                ref={inputPriceRef}
                value={price}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 7);
                  setPrice(v);
                  if (v) setFieldErr((p) => ({ ...p, price: "" }));
                }}
                maxLength={7}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2",
                  fieldErr.price ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                ].join(" ")}
                placeholder="Enter price"
                inputMode="numeric"
              />
              {fieldErr.price ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.price}</div> : null}
            </div>

            <div ref={refStartDate}>
              <div className="text-sm font-semibold text-emerald-900/70">Start Date</div>
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
                    const minEnd = new Date(toYMD(addMonths(new Date(v), 1)));
                    const maxEnd = new Date(toYMD(addMonths(new Date(v), 3)));
                    if (end < minEnd || end > maxEnd) setEndDate("");
                  }
                }}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2",
                  fieldErr.startDate ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                ].join(" ")}
              />
              {fieldErr.startDate ? (
                <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.startDate}</div>
              ) : null}
            </div>

            <div ref={refEndDate}>
              <div className="text-sm font-semibold text-emerald-900/70">End Date</div>
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
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2",
                  !startDate ? "bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200" : "",
                  fieldErr.endDate ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                ].join(" ")}
              />
              {fieldErr.endDate ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.endDate}</div> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div ref={refLocation} className="md:col-span-2">
              <div className="text-sm font-semibold text-emerald-900/70">Location</div>
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (e.target.value) setFieldErr((p) => ({ ...p, location: "" }));
                }}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2",
                  fieldErr.location ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                ].join(" ")}
              >
                <option value="">Select a place</option>
                {NEPAL_PLACES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {fieldErr.location ? (
                <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.location}</div>
              ) : null}
            </div>

            <div ref={refType}>
              <div className="text-sm font-semibold text-emerald-900/70">Type</div>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (e.target.value) setFieldErr((p) => ({ ...p, type: "" }));
                }}
                className={[
                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2",
                  fieldErr.type ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                ].join(" ")}
              >
                <option value="">Select type</option>
                <option value="Adventure">Adventure</option>
                <option value="Cultural">Cultural</option>
                <option value="Nature">Nature</option>
                <option value="Religious">Religious</option>
              </select>
              {fieldErr.type ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.type}</div> : null}
            </div>
          </div>

          <div ref={refStatus}>
            <div className="text-sm font-semibold text-emerald-900/70">Status</div>
            <select
              value={listingStatus}
              onChange={(e) => {
                setListingStatus(e.target.value);
                if (e.target.value) setFieldErr((p) => ({ ...p, listingStatus: "" }));
              }}
              className={[
                "mt-2 w-full rounded-xl border px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2",
                fieldErr.listingStatus ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
              ].join(" ")}
            >
              <option value="">Select status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            {fieldErr.listingStatus ? (
              <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.listingStatus}</div>
            ) : null}
          </div>

          <div ref={refMap} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <FiMapPin />
                Pick Location on Map
              </div>
              <div className="text-xs text-gray-600">Click map / drag marker OR type lat/lng.</div>
            </div>

            {fieldErr.coords ? <div className="mt-2 text-xs font-semibold text-red-600">{fieldErr.coords}</div> : null}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700">Latitude</div>
                <input
                  value={latInput}
                  onChange={(e) => setLatInput(sanitizeDecimal(e.target.value))}
                  className={[
                    "mt-2 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2",
                    fieldErr.lat ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                  ].join(" ")}
                  placeholder="e.g., 27.6727000"
                  inputMode="decimal"
                />
                {fieldErr.lat ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.lat}</div> : null}
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-700">Longitude</div>
                <input
                  value={lngInput}
                  onChange={(e) => setLngInput(sanitizeDecimal(e.target.value))}
                  className={[
                    "mt-2 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2",
                    fieldErr.lng ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-500",
                  ].join(" ")}
                  placeholder="e.g., 85.4298000"
                  inputMode="decimal"
                />
                {fieldErr.lng ? <div className="mt-1 text-xs font-semibold text-red-600">{fieldErr.lng}</div> : null}
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
              <div className="h-[260px]">
                <MapContainer
                  center={[nepalCenter.lat, nepalCenter.lng]}
                  zoom={7}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  <FlyToMarker coords={coords} zoom={12} active={shouldFly} onDone={() => setShouldFly(false)} />

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
                            setFieldErr((prev) => ({ ...prev, coords: "Pick a location inside Nepal." }));
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

              <div className="px-4 py-3 text-xs text-gray-600 flex flex-wrap gap-3">
                <div>
                  <span className="font-semibold">Lat:</span> {coords?.lat ? Number(coords.lat).toFixed(6) : "—"}
                </div>
                <div>
                  <span className="font-semibold">Lng:</span> {coords?.lng ? Number(coords.lng).toFixed(6) : "—"}
                </div>
              </div>
            </div>
          </div>

          <div ref={refImage} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="text-sm font-semibold text-emerald-900">Upload Image</div>

            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => document.getElementById("tour_image_input")?.click()}
              className={[
                "mt-3 cursor-pointer rounded-2xl border bg-white p-4",
                fieldErr.image ? "border-red-300" : "border-emerald-100",
              ].join(" ")}
            >
              <input
                id="tour_image_input"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700">
                    <FiUploadCloud size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Drag & drop image here, or click to choose</div>
                    <div className="text-xs text-gray-500">PNG/JPG/WEBP • max 2MB</div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-emerald-800">{imageFile ? "Selected" : "No file"}</div>
              </div>

              {fieldErr.image ? <div className="mt-2 text-xs font-semibold text-red-600">{fieldErr.image}</div> : null}

              {previewUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-[180px] object-cover" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <FiSave />
                {saving ? "Saving..." : "Save Tour"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </AgencyLayout>
  );
}