// client/src/components/public/TourGrid.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  fetchWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from "../../api/wishlistApi";
import { FaHeart, FaMapMarkerAlt, FaUsers, FaEye, FaCheck } from "react-icons/fa";
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

export default function TourGrid({ tours, onRequireLogin }) {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);

  const requireLogin = () => {
    if (!token) {
      if (typeof onRequireLogin === "function") {
        return onRequireLogin();
      }
      return false;
    }
    return true;
  };

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setWishlistIds(new Set());
        return;
      }

      try {
        const res = await fetchWishlistIds(token);
        const ids = Array.isArray(res?.data)
          ? res.data
          : res?.ids || res?.data || [];
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
    } finally {
      setBusyId(null);
    }
  };

  if (!tours || tours.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500"
      >
        No tours found. Try different filters.
      </motion.div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {tours.map((tour, index) => {
          const idNum = Number(tour.id);
          const inWishlist = wishlistIds.has(idNum);
          const isBusy = busyId === idNum;
          const imgSrc = toPublicImageUrl(tour.image_url || tour.image) || FALLBACK_TOUR_IMG;

          return (
            <motion.article
              key={tour.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{
                duration: 0.4,
                delay: Math.min(index * 0.04, 0.2),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-44 w-full overflow-hidden">
                <img
                  src={imgSrc}
                  alt={tour.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_TOUR_IMG;
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 md:text-base">
                  {tour.title}
                </h3>

                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                  {tour.short_description}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    {tour.type}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                    {tour.location}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-900">
                  <span className="text-xs text-gray-500">From </span>
                  <span className="font-semibold">
                    NPR {Number(tour.starting_price).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/tours/${tour.id}`)}
                    className="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-2 py-2 text-[11px] font-medium text-white shadow transition-transform md:text-xs"
                    type="button"
                  >
                    <FaEye size={14} /> View Details
                  </motion.button>

                  <motion.button
                    whileHover={isBusy ? {} : { y: -1 }}
                    whileTap={isBusy ? {} : { scale: 0.98 }}
                    disabled={isBusy}
                    onClick={() => toggleWishlist(tour.id)}
                    className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-[11px] font-medium shadow transition-all md:text-xs ${
                      inWishlist
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-[#e6f4ed] text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white"
                    } ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
                    type="button"
                  >
                    {inWishlist ? <FaCheck size={14} /> : <FaHeart size={14} />}
                    {inWishlist ? "Added to Wishlist" : "Add to Wishlist"}
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#e6f4ed] px-2 py-2 text-[11px] font-medium text-emerald-700 shadow transition-all hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white md:text-xs"
                    type="button"
                  >
                    <FaUsers size={14} /> Show All Agencies
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!requireLogin()) return;
                      navigate(`/map?tour=${tour.id}`);
                    }}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#e6f4ed] px-2 py-2 text-[11px] font-medium text-emerald-700 shadow transition-all hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white md:text-xs"
                    type="button"
                  >
                    <FaMapMarkerAlt size={14} /> View on Map
                  </motion.button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}