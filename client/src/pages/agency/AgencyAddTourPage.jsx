// client/src/pages/agency/AgencyAddTourPage.jsx
import { useMemo, useRef, useState } from "react";
import { FiUploadCloud, FiMapPin, FiSave } from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
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
  if (!open) return null;

  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[200]">
      <div className={`rounded-2xl border px-4 py-3 shadow-lg ${boxClass}`}>
        <div className="text-sm font-semibold">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs font-semibold opacity-80 hover:opacity-100"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Nepal bounding box (rough, practical validation)
function isInsideNepal(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;

  return la >= 26.35 && la <= 30.45 && lo >= 80.0 && lo <= 88.3;
}

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
  return <Marker position={[value.lat, value.lng]} />;
}

function FlyToMarker({ coords, zoom = 12, active = false, onDone }) {
  const map = useMap();

  if (!active) return null;
  if (!coords?.lat || !coords?.lng) return null;

  map.flyTo([coords.lat, coords.lng], zoom, { duration: 0.8 });

  if (typeof onDone === "function") onDone();
  return null;
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

export default function AgencyAddTourPage() {
  const dropRef = useRef(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [price, setPrice] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [location, setLocation] = useState("");
  const [type, setType] = useState("");

  const [coords, setCoords] = useState(null); // {lat,lng}
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

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    window.clearTimeout(AgencyAddTourPage._t);
    AgencyAddTourPage._t = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const nepalCenter = useMemo(() => ({ lat: 28.3949, lng: 84.124 }), []);

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

    if (
      !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)
    ) {
      showToast("error", "Only PNG/JPG/WEBP allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be max 2MB.");
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    onPickImage(file);
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
      return;
    }

    if (!isInsideNepal(la, lo)) {
      showToast("error", "Latitude/Longitude must be inside Nepal.");
      return;
    }

    setCoordsBoth({ lat: la, lng: lo });
    setShouldFly(true);
  };

  const validate = () => {
    if (!title.trim()) return "Tour title is required.";
    if (!desc.trim()) return "Description is required.";
    if (!price || Number(price) <= 0) return "Price must be greater than 0.";

    if (!startDate || !endDate) return "Start date and end date are required.";
    if (new Date(endDate) < new Date(startDate))
      return "End date must be after start date.";

    const loc = String(location || "").trim();
    if (!loc) return "Location is required.";
    if (!loc.toLowerCase().endsWith("nepal"))
      return "Location must be in Nepal (end with 'Nepal').";

    if (!type) return "Type is required.";

    if (!coords?.lat || !coords?.lng)
      return "Please pick location on map or type lat/lng.";
    if (!isInsideNepal(coords.lat, coords.lng))
      return "Selected coordinates must be inside Nepal.";

    if (!imageFile) return "Please upload 1 cover image.";

    return "";
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      showToast("error", err);
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
      fd.append("latitude", String(coords.lat));
      fd.append("longitude", String(coords.lng));
      fd.append("start_date", startDate);
      fd.append("end_date", endDate);
      fd.append("image", imageFile);

      await createAgencyTour(fd);

      showToast("success", "Tour saved successfully.");

      setTitle("");
      setDesc("");
      setPrice("");
      setStartDate("");
      setEndDate("");
      setLocation("");
      setType("");
      setCoords(null);
      setLatInput("");
      setLngInput("");
      setShouldFly(false);
      setImageFile(null);
      setPreviewUrl("");
    } catch (e) {
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
            <div className="text-xs text-gray-500 mt-1">
              Add a new tour for your agency. This will appear on the tourist
              website and map.
            </div>
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
          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Tour Title
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter tour title"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Description
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
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
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter price"
                inputMode="numeric"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Start Date
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                End Date
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-emerald-900/70">
                Location (Nepal only)
              </div>

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a place</option>
                {NEPAL_PLACES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <div className="mt-1 text-xs text-gray-500">
                Selected location will be saved in database (example: "Pokhara,
                Nepal").
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-900/70">
                Type
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
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

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <FiMapPin />
                Pick Location on Map
              </div>

              <div className="text-xs text-gray-600">
                You can click map / drag marker OR type lat/lng.
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-700">
                  Latitude (Nepal only)
                </div>
                <input
                  value={latInput}
                  onChange={(e) => setLatInput(sanitizeDecimal(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., 27.6727000"
                  inputMode="decimal"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-700">
                  Longitude (Nepal only)
                </div>
                <input
                  value={lngInput}
                  onChange={(e) => setLngInput(sanitizeDecimal(e.target.value))}
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
              <div className="h-[260px]">
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
                            return;
                          }
                          setCoordsBoth({ lat: p.lat, lng: p.lng });
                        },
                      }}
                    />
                  ) : (
                    <PickMarker
                      value={coords}
                      onChange={setCoordsBoth}
                      onInvalid={(msg) => showToast("error", msg)}
                    />
                  )}

                  <PickMarker
                    value={coords}
                    onChange={(c) => {
                      setShouldFly(false);
                      setCoordsBoth(c);
                    }}
                    onInvalid={(msg) => showToast("error", msg)}
                  />
                </MapContainer>
              </div>

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

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="text-sm font-semibold text-emerald-900">
              Upload Image (single cover image)
            </div>

            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() =>
                document.getElementById("tour_image_input")?.click()
              }
              className="mt-3 cursor-pointer rounded-2xl border border-emerald-100 bg-white p-4"
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
                    <div className="text-sm font-semibold text-gray-900">
                      Drag & drop image here, or click to choose
                    </div>
                    <div className="text-xs text-gray-500">
                      PNG/JPG/WEBP • max 2MB
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-emerald-800">
                  {imageFile ? "Selected" : "No file"}
                </div>
              </div>

              {previewUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-[180px] object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-3 text-xs text-gray-600">
                Use a specific tour photo. This will be the main image on tourist
                website.
              </div>
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
