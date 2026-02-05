import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { fetchTourMapTours } from "../../api/tourApi";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function TouristNepalMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourParam = searchParams.get("tour"); // ?tour=ID

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [selectedType, setSelectedType] = useState("all");

  // map view state (center + zoom)
  const nepalCenter = [28.3949, 84.124];
  const [mapCenter, setMapCenter] = useState(nepalCenter);
  const [mapZoom, setMapZoom] = useState(7);

  // marker popup refs for auto-open
  const markerRefs = useRef({}); // { [id]: markerInstance }
  const [focusTourId, setFocusTourId] = useState(null); // id to open popup

  const TYPES = [
    { value: "all", label: "All Types" },
    { value: "Adventure", label: "Adventure" },
    { value: "Cultural", label: "Cultural" },
    { value: "Nature", label: "Nature" },
    { value: "Religious", label: "Religious" },
  ];

  const selectedTypeLabel =
    TYPES.find((t) => t.value === selectedType)?.label || "All Types";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchTourMapTours();
        setTours(res?.data || []);
      } catch (e) {
        console.error("Failed to load map tours", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toursWithCoords = useMemo(() => {
    return (tours || []).filter((t) => t.latitude && t.longitude);
  }, [tours]);

  const filteredTours = useMemo(() => {
    if (selectedType === "all") return toursWithCoords;
    return toursWithCoords.filter((t) => t.type === selectedType);
  }, [toursWithCoords, selectedType]);

  // When opened via /map?tour=ID → auto filter + center + open popup
  useEffect(() => {
    if (!tourParam) {
      // If coming from hero button /map (no param) -> normal default
      setFocusTourId(null);
      setSelectedType("all");
      setMapCenter(nepalCenter);
      setMapZoom(7);
      return;
    }

    if (loading) return;
    if (!toursWithCoords.length) return;

    const idNum = Number(tourParam);
    if (!idNum) return;

    const found = toursWithCoords.find((t) => Number(t.id) === idNum);
    if (!found) return;

    // apply filter based on that tour
    setSelectedType(found.type);

    // zoom + center to tour
    setMapCenter([Number(found.latitude), Number(found.longitude)]);
    setMapZoom(11);

    // open popup after markers mount
    setFocusTourId(idNum);
  }, [tourParam, loading, toursWithCoords]);

  // open popup when marker ref exists
  useEffect(() => {
    if (!focusTourId) return;

    const t = setTimeout(() => {
      const marker = markerRefs.current[focusTourId];
      if (marker && marker.openPopup) {
        marker.openPopup();
      }
    }, 300);

    return () => clearTimeout(t);
  }, [focusTourId, selectedType]);

  const reset = () => {
    // ✅ clear URL param too
    navigate("/map");
    setSelectedType("all");
    setMapCenter(nepalCenter);
    setMapZoom(7);
    setFocusTourId(null);
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] pt-6 pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-start md:items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Nepal Tour Map
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Explore tours by destination on the map
              </p>
            </div>

            {/* Filter bar */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  Tour Type
                </span>

                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="appearance-none text-sm font-semibold text-gray-800
                               bg-white border border-gray-300 rounded-xl
                               pl-3 pr-10 py-2
                               hover:border-emerald-400
                               focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400
                               transition"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-base">
                    ▼
                  </span>
                </div>

                <span
                  className="ml-1 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px]
                                 bg-emerald-50 text-emerald-700 border border-emerald-100"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {selectedTypeLabel}
                </span>

                <span
                  className="ml-1 hidden md:inline-flex items-center px-2 py-1 rounded-full text-[11px]
                                 bg-gray-50 text-gray-600 border border-gray-100"
                >
                  Tours:{" "}
                  <span className="ml-1 font-semibold">
                    {filteredTours.length}
                  </span>
                </span>
              </div>

              <button
                onClick={reset}
                className={[
                  "group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold shadow-sm transition-all duration-200",
                  "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:-translate-y-[1px] active:translate-y-0",
                ].join(" ")}
              >
                <span className="inline-block transition-transform duration-200 group-hover:rotate-[-12deg]">
                  ↺
                </span>
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="h-[70vh] flex items-center justify-center text-sm text-gray-500">
                Loading map...
              </div>
            ) : (
              <>
                {toursWithCoords.length === 0 && (
                  <div className="px-4 py-3 text-sm text-amber-700 bg-amber-50 border-b border-amber-100">
                    No tour coordinates found. Add latitude/longitude in the
                    database to show markers.
                  </div>
                )}

                {toursWithCoords.length > 0 && filteredTours.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-700 bg-gray-50 border-b border-gray-100">
                    No tours found for{" "}
                    <span className="font-semibold">{selectedType}</span>. Try
                    another type.
                  </div>
                )}

                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "70vh", width: "100%", zIndex: 1 }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {filteredTours.map((tour) => (
                    <Marker
                      key={tour.id}
                      position={[Number(tour.latitude), Number(tour.longitude)]}
                      ref={(ref) => {
                        if (ref) markerRefs.current[Number(tour.id)] = ref;
                      }}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <div className="font-semibold">{tour.title}</div>
                          <div className="text-xs text-gray-600">
                            {tour.location} • {tour.type}
                          </div>

                          <div className="text-xs">
                            From{" "}
                            <span className="font-semibold">
                              NPR{" "}
                              {Number(tour.starting_price).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() =>
                                (window.location.href = `/tours/${tour.id}`)
                              }
                              className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs
                                         transition-all duration-200 hover:bg-emerald-700 hover:scale-[1.04]"
                            >
                              View Details
                            </button>

                            <button
                              onClick={() =>
                                (window.location.href = `/tours/${tour.id}#agencies`)
                              }
                              className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs border border-emerald-100
                                         transition-all duration-200 hover:bg-emerald-100 hover:border-emerald-200 hover:scale-[1.04]"
                            >
                              Agencies
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </>
            )}
          </div>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}
