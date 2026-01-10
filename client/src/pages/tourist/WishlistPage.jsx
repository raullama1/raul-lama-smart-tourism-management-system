import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { fetchWishlist } from "../../api/wishlistApi";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { FaEye, FaTrash, FaUsers, FaMapMarkerAlt } from "react-icons/fa";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { remove } = useWishlist();
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shared button animation styling to keep UI consistent across actions.
  const btnBase =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium " +
    "transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 " +
    "shadow-sm hover:shadow-md";

  // Loads wishlist items for authenticated users and resets on logout.
  const load = useCallback(async () => {
    try {
      setLoading(true);

      if (!token) {
        setItems([]);
        return;
      }

      const res = await fetchWishlist(token);
      setItems(res?.data || []);
    } catch (e) {
      console.error("Failed to load wishlist", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Removes an item only if the API call succeeds to avoid UI desync.
  const handleRemove = async (tourId) => {
    const result = await remove(tourId);
    if (!result?.ok) return;

    setItems((prev) => prev.filter((x) => x.id !== tourId));
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Wishlist
            </h1>
            <p className="text-xs md:text-sm text-emerald-700 mt-1">
              Saved experiences across Nepal: mountains, jungles, heritage cities.
            </p>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                Loading wishlist...
              </div>
            ) : !token ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="text-gray-900 font-semibold">
                  Please login to view your wishlist
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Your wishlist is saved in your account.
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  Go to Login
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="text-gray-900 font-semibold">No wishlist yet</div>
                <div className="text-sm text-gray-500 mt-1">
                  Add tours from the Tours page and they will appear here.
                </div>
                <button
                  onClick={() => navigate("/tours")}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  Browse Tours
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tour) => {
                  const agencyCount = Number(tour.agency_count || 0);
                  const isMultiple = agencyCount > 1;

                  return (
                    <article
                      key={tour.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="h-44 w-full overflow-hidden">
                        <img
                          src={tour.image_url}
                          alt={tour.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                            {tour.title}
                          </h3>
                          <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            NPR {Number(tour.starting_price).toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {agencyCount} {agencyCount === 1 ? "agency" : "agencies"}
                          </span>

                          {isMultiple && (
                            <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 font-medium">
                              Multiple
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => navigate(`/tours/${tour.id}`)}
                            className={`${btnBase} bg-emerald-700 text-white hover:bg-emerald-800`}
                          >
                            <FaEye /> View Details
                          </button>

                          <button
                            onClick={() => handleRemove(tour.id)}
                            className={`${btnBase} border border-gray-200 bg-white text-gray-800 hover:bg-gray-50`}
                          >
                            <FaTrash /> Remove
                          </button>

                          <button
                            onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                            className={`${btnBase} bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100`}
                          >
                            <FaUsers /> Agencies
                          </button>

                          <button
                            onClick={() => navigate(`/map?tour=${tour.id}`)}
                            className={`${btnBase} bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100`}
                          >
                            <FaMapMarkerAlt /> View on Map
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}
