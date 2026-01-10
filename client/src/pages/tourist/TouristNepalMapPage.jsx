import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { fetchTourMapTours } from "../../api/tourApi";

// Fix default marker icon (common Leaflet issue in Vite)
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
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nepal center
  const nepalCenter = [28.3949, 84.1240]; // lat, lng

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchTourMapTours();

        // your fetchPublicTours returns { data, pagination }
        const list = res?.data || [];
        setTours(list);
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

  return (
    <>
      <NavbarTourist />
      <main className="bg-[#e6f4ec] pt-6 pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Nepal Tour Map
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Explore tours by destination on the map
              </p>
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
                    No tour coordinates found. Add latitude/longitude in the database to show markers.
                  </div>
                )}

                <MapContainer
                  center={nepalCenter}
                  zoom={7}
                  style={{ height: "70vh", width: "100%", zIndex: 1 }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {toursWithCoords.map((tour) => (
                    <Marker
                      key={tour.id}
                      position={[Number(tour.latitude), Number(tour.longitude)]}
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
                              NPR {Number(tour.starting_price).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() =>
                                (window.location.href = `/tours/${tour.id}`)
                              }
                              className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() =>
                                (window.location.href = `/tours/${tour.id}#agencies`)
                              }
                              className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs border border-emerald-100"
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
