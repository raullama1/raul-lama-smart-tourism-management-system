// client/src/components/public/TourCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import {
  FaHeart,
  FaMapMarkerAlt,
  FaUsers,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import {
  fetchWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from "../../api/wishlistApi";

gsap.registerPlugin(Draggable);

export default function TourCard({
  tours = [],
  showSectionHeader = false,
  cardWidth = "w-64 md:w-72 lg:w-72",
}) {
  const containerRef = useRef(null);
  const draggableRef = useRef(null);
  const resizeObsRef = useRef(null);

  const navigate = useNavigate();
  const { token } = useAuth();

  const [dims, setDims] = useState({ itemW: 288, gap: 16, ready: false });

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);

  // normalize tour fields
  const normalizedTours = useMemo(() => {
    return (tours || []).map((t) => ({
      id: t.id,
      title: t.title || t.name,
      location: t.location,
      type: t.type,
      image: t.image_url || t.image,
      price: t.starting_price ?? t.price,
    }));
  }, [tours]);

  // Render 3 copies for seamless infinite wrap (React-controlled, NO DOM clone)
  const tripledTours = useMemo(() => {
    if (!normalizedTours.length) return [];
    return [...normalizedTours, ...normalizedTours, ...normalizedTours];
  }, [normalizedTours]);

  const requireLogin = () => {
    if (!token) {
      alert("Please login or signup to access this feature.");
      return false;
    }
    return true;
  };

  // load wishlist ids
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

    // Optimistic UI update (instant button change)
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (already) next.delete(idNum);
      else next.add(idNum);
      return next;
    });

    try {
      setBusyId(idNum);

      if (already) {
        await removeFromWishlist(token, idNum);
      } else {
        await addToWishlist(token, idNum);
      }
    } catch (e) {
      console.error("Wishlist update failed", e);

      // rollback on error
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (already) next.add(idNum);
        else next.delete(idNum);
        return next;
      });

      alert("Wishlist update failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // --------- Infinite wrap helpers (smooth, no teleport) ---------
  const measure = () => {
    const container = containerRef.current;
    if (!container) return;

    const firstCard = container.querySelector("[data-tour-card='true']");
    if (!firstCard) return;

    const itemW = firstCard.getBoundingClientRect().width || 288;

    const styles = getComputedStyle(container);
    const gapStr = styles.gap || styles.columnGap || "0";
    const gap = Number.parseFloat(gapStr) || 16;

    setDims({ itemW, gap, ready: true });
  };

  const singleWidth = () => normalizedTours.length * (dims.itemW + dims.gap);

  const wrapX = (x) => {
    const single = singleWidth();
    if (!single || !normalizedTours.length) return x;
    // keep x always inside the middle copy range
    const wrap = gsap.utils.wrap(-2 * single, 0);
    return wrap(x);
  };

  const applyWrap = () => {
    const container = containerRef.current;
    if (!container) return;
    const x = Number(gsap.getProperty(container, "x")) || 0;
    gsap.set(container, { x: wrapX(x) });
  };

  const destroyDraggable = () => {
    if (draggableRef.current) {
      draggableRef.current.kill();
      draggableRef.current = null;
    }
  };

  // measure on mount + resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !normalizedTours.length) return;

    measure();

    if (resizeObsRef.current) resizeObsRef.current.disconnect();
    resizeObsRef.current = new ResizeObserver(() => measure());
    resizeObsRef.current.observe(container);

    return () => {
      if (resizeObsRef.current) {
        resizeObsRef.current.disconnect();
        resizeObsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedTours.length]);

  // init draggable after measure
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !dims.ready || !normalizedTours.length) return;

    destroyDraggable();

    const single = singleWidth();

    // start in the middle copy (so you can drag both ways)
    gsap.set(container, { x: -single });

    draggableRef.current = Draggable.create(container, {
      type: "x",
      inertia: true,
      dragResistance: 0.12,
      allowContextMenu: true,
      onPress() {
        container.style.cursor = "grabbing";
      },
      onRelease() {
        container.style.cursor = "grab";
      },
      onDrag: applyWrap,
      onThrowUpdate: applyWrap,
    })[0];

    container.style.cursor = "grab";

    return () => {
      destroyDraggable();
      container.style.cursor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.ready, dims.itemW, dims.gap, normalizedTours.length]);

  const moveBy = (delta) => {
    const container = containerRef.current;
    if (!container) return;

    gsap.to(container, {
      x: `+=${delta}`,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: applyWrap,
      onComplete: applyWrap,
    });
  };

  const scrollLeft = () => moveBy(dims.itemW + dims.gap);
  const scrollRight = () => moveBy(-(dims.itemW + dims.gap));

  // --------------------------------------------------------------

  return (
    <div className="bg-[#e6f4ec] py-8 md:py-10 relative">
      <section className="max-w-6xl mx-auto px-4 md:px-6 relative">
        {showSectionHeader && (
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Popular Tours
            </h2>
          </div>
        )}

        {/* Arrows */}
        <button
          onClick={scrollLeft}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
          type="button"
          aria-label="Previous"
          title="Previous"
        >
          <FaChevronLeft size={20} />
        </button>

        <button
          onClick={scrollRight}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
          type="button"
          aria-label="Next"
          title="Next"
        >
          <FaChevronRight size={20} />
        </button>

        {/* Cards */}
        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-5 select-none"
            style={{ width: "max-content", alignItems: "stretch" }}
          >
            {tripledTours.map((tour, idx) => {
              const idNum = Number(tour.id);
              const inWishlist = wishlistIds.has(idNum);
              const isBusy = busyId === idNum;

              return (
                <div
                  key={`${tour.id}-${idx}`} // must be unique in triple list
                  className={`flex-shrink-0 ${cardWidth}`}
                  data-tour-card="true"
                >
                  <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105"
                      draggable="false"
                    />

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">
                        {tour.title}
                      </h3>

                      <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                        <span className="line-clamp-1">{tour.location}</span>
                        <span>•</span>
                        <span className="line-clamp-1">{tour.type}</span>
                      </div>

                      <div className="mt-2 text-sm text-gray-800">
                        <span className="text-gray-500">From </span>
                        <span className="font-semibold">
                          Rs {Number(tour.price || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/tours/${tour.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs md:text-sm font-medium shadow hover:scale-105 transition-transform"
                          type="button"
                        >
                          <FaEye size={14} /> View Details
                        </button>

                        {/* Wishlist */}
                        <button
                          disabled={isBusy}
                          onClick={() => toggleWishlist(tour.id)}
                          className={`w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md text-xs md:text-sm font-medium shadow transition-all
                            ${
                              inWishlist
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-[#e6f4ed] text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white"
                            }
                            ${isBusy ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}
                          `}
                          type="button"
                        >
                          {inWishlist ? <FaCheck size={14} /> : <FaHeart size={14} />}
                          {inWishlist ? "Added to Wishlist" : "Add to Wishlist"}
                        </button>

                        {/* Agencies */}
                        <button
                          onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-xs md:text-sm font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                          type="button"
                        >
                          <FaUsers size={14} /> Show All Agencies
                        </button>

                        {/* Map */}
                        <button
                          onClick={() => {
                            if (!requireLogin()) return;
                            navigate(`/map?tour=${tour.id}`);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-xs md:text-sm font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                          type="button"
                        >
                          <FaMapMarkerAlt size={14} /> View on Map
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {normalizedTours.length === 0 && (
              <div className="text-sm text-gray-500 p-4">No tours available.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
