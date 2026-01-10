// client/src/components/public/TourGrid.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from "../../api/wishlistApi";
import { FaHeart, FaMapMarkerAlt, FaUsers, FaEye, FaCheck } from "react-icons/fa";

export default function TourGrid({ tours }) {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);

  const requireLogin = () => {
    if (!token) {
      alert("Please login or signup to access this feature.");
      return false;
    }
    return true;
  };

  // Load wishlist ids
  useEffect(() => {
    const load = async () => {
      if (!token) {
        setWishlistIds(new Set());
        return;
      }
      try {
        const res = await fetchWishlistIds(token);
        const ids = Array.isArray(res?.data) ? res.data : res?.ids || res?.data || [];
        setWishlistIds(new Set(ids.map((x) => Number(x))));
      } catch (e) {
        console.error("Failed to load wishlist ids", e);
      }
    };
    load();
  }, [token]);

  const toggleWishlist = async (tourId) => {
    if (!requireLogin()) return;

    const idNum = Number(tourId);
    if (busyId === idNum) return;

    const already = wishlistIds.has(idNum);

    try {
      setBusyId(idNum);

      if (already) {
        await removeFromWishlist(token, idNum);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(idNum);
          return next;
        });
      } else {
        await addToWishlist(token, idNum);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.add(idNum);
          return next;
        });
      }
    } catch (e) {
      console.error("Wishlist toggle failed", e);
      alert("Wishlist update failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!tours || tours.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500">
        No tours found. Try different filters.
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => {
          const idNum = Number(tour.id);
          const inWishlist = wishlistIds.has(idNum);
          const isBusy = busyId === idNum;

          return (
            <article
              key={tour.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="h-44 w-full overflow-hidden">
                <img
                  src={tour.image_url}
                  alt={tour.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                  {tour.title}
                </h3>

                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {tour.short_description}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 items-center text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                    {tour.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {tour.location}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-900">
                  <span className="text-gray-500 text-xs">From </span>
                  <span className="font-semibold">
                    NPR {Number(tour.starting_price).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/tours/${tour.id}`)}
                    className="flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[11px] md:text-xs font-medium shadow hover:scale-105 transition-transform"
                  >
                    <FaEye size={14} /> View Details
                  </button>

                  <button
                    disabled={isBusy}
                    onClick={() => toggleWishlist(tour.id)}
                    className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md text-[11px] md:text-xs font-medium shadow transition-all
                      ${
                        inWishlist
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-[#e6f4ed] text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white"
                      }
                      ${isBusy ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}
                    `}
                  >
                    {inWishlist ? <FaCheck size={14} /> : <FaHeart size={14} />}
                    {inWishlist ? "Added to Wishlist" : "Add to Wishlist"}
                  </button>

                  <button
                    onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                    className="flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-[11px] md:text-xs font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                  >
                    <FaUsers size={14} /> Show All Agencies
                  </button>

                  <button
                    onClick={() => {
                      if (!requireLogin()) return;
                      navigate("/map");
                    }}
                    className="flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-[11px] md:text-xs font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                  >
                    <FaMapMarkerAlt size={14} /> View on Map
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
