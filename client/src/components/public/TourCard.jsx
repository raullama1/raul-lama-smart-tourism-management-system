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
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

gsap.registerPlugin(Draggable);

export default function TourCard({
  tours = [],
  showSectionHeader = false,
  sectionTitle = "Popular Tours",
  cardWidth = "w-64 md:w-72 lg:w-72",
  onRequireLogin,
  onWishlistChanged,
}) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const draggableRef = useRef(null);
  const resizeObsRef = useRef(null);

  const navigate = useNavigate();
  const { token } = useAuth();

  const [dims, setDims] = useState({
    itemW: 288,
    gap: 16,
    segmentW: 0,
    ready: false,
  });
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);

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

  const repeatedBaseTours = useMemo(() => {
    if (!normalizedTours.length) return [];

    if (normalizedTours.length >= 6) {
      return normalizedTours;
    }

    const targetMinCards = Math.max(6, normalizedTours.length * 2);
    const loops = Math.ceil(targetMinCards / normalizedTours.length);

    return Array.from({ length: loops }, () => normalizedTours).flat();
  }, [normalizedTours]);

  const tripledTours = useMemo(() => {
    if (!repeatedBaseTours.length) return [];
    return [...repeatedBaseTours, ...repeatedBaseTours, ...repeatedBaseTours];
  }, [repeatedBaseTours]);

  const requireLogin = () => {
    if (!token) {
      if (typeof onRequireLogin === "function") {
        onRequireLogin();
      } else {
        alert("Please login or signup to access this feature.");
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

      if (typeof onWishlistChanged === "function") {
        onWishlistChanged();
      }
    } catch (e) {
      console.error("Wishlist update failed", e);

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

  const destroyDraggable = () => {
    if (draggableRef.current) {
      draggableRef.current.kill();
      draggableRef.current = null;
    }
  };

  const measure = () => {
    const container = containerRef.current;
    if (!container || !repeatedBaseTours.length) return;

    const cards = container.querySelectorAll("[data-tour-card='true']");
    if (!cards.length) return;

    const firstCard = cards[0];
    const firstSegmentLastCard = cards[repeatedBaseTours.length - 1];
    if (!firstCard || !firstSegmentLastCard) return;

    const itemW = firstCard.getBoundingClientRect().width || 288;

    const styles = getComputedStyle(container);
    const gapStr = styles.gap || styles.columnGap || "0";
    const gap = Number.parseFloat(gapStr) || 16;

    const segmentStart = firstCard.offsetLeft;
    const segmentEnd =
      firstSegmentLastCard.offsetLeft + firstSegmentLastCard.offsetWidth;
    let segmentW = Math.max(segmentEnd - segmentStart, itemW);

    const viewportW = viewportRef.current?.clientWidth || 0;
    if (viewportW > 0 && segmentW < viewportW * 1.5) {
      segmentW = Math.max(segmentW, viewportW * 1.5);
    }

    setDims({
      itemW,
      gap,
      segmentW,
      ready: true,
    });
  };

  const wrapX = (x) => {
    const segment = dims.segmentW;
    if (!segment || !repeatedBaseTours.length) return x;

    while (x >= 0) x -= segment;
    while (x < -2 * segment) x += segment;

    return x;
  };

  const applyWrap = () => {
    const container = containerRef.current;
    if (!container || !dims.segmentW) return;

    const x = Number(gsap.getProperty(container, "x")) || 0;
    const wrapped = wrapX(x);

    if (wrapped !== x) {
      gsap.set(container, { x: wrapped });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport || !repeatedBaseTours.length) return;

    measure();

    if (resizeObsRef.current) resizeObsRef.current.disconnect();

    resizeObsRef.current = new ResizeObserver(() => {
      measure();
    });

    resizeObsRef.current.observe(container);
    resizeObsRef.current.observe(viewport);

    const firstCard = container.querySelector("[data-tour-card='true']");
    if (firstCard) {
      resizeObsRef.current.observe(firstCard);
    }

    return () => {
      if (resizeObsRef.current) {
        resizeObsRef.current.disconnect();
        resizeObsRef.current = null;
      }
    };
  }, [repeatedBaseTours.length, cardWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !dims.ready || !dims.segmentW || !repeatedBaseTours.length) return;

    destroyDraggable();

    gsap.killTweensOf(container);
    gsap.set(container, { x: -dims.segmentW });

    draggableRef.current = Draggable.create(container, {
      type: "x",
      inertia: true,
      dragResistance: 0.12,
      allowContextMenu: true,
      onPress() {
        gsap.killTweensOf(container);
        container.style.cursor = "grabbing";
      },
      onRelease() {
        container.style.cursor = "grab";
      },
      onDrag: applyWrap,
      onThrowUpdate: applyWrap,
      onThrowComplete: applyWrap,
    })[0];

    container.style.cursor = "grab";

    return () => {
      destroyDraggable();
      container.style.cursor = "";
    };
  }, [dims.ready, dims.segmentW, repeatedBaseTours.length]);

  const moveBy = (delta) => {
    const container = containerRef.current;
    if (!container || !dims.segmentW) return;

    gsap.killTweensOf(container);

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

  return (
    <div className="bg-[#e6f4ec] py-8 md:py-10 relative">
      <section className="max-w-6xl mx-auto px-4 md:px-6 relative">
        {showSectionHeader && (
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              {sectionTitle}
            </h2>
          </div>
        )}

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

        <div ref={viewportRef} className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-5 select-none"
            style={{ width: "max-content", alignItems: "stretch" }}
          >
            {tripledTours.map((tour, idx) => {
              const idNum = Number(tour.id);
              const inWishlist = wishlistIds.has(idNum);
              const isBusy = busyId === idNum;
              const imgSrc = toPublicImageUrl(tour.image) || FALLBACK_TOUR_IMG;

              return (
                <div
                  key={`${tour.id}-${idx}`}
                  className={`flex-shrink-0 ${cardWidth}`}
                  data-tour-card="true"
                >
                  <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={imgSrc}
                      alt={tour.title}
                      className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105"
                      draggable="false"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_TOUR_IMG;
                      }}
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

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/tours/${tour.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs md:text-sm font-medium shadow hover:scale-105 transition-transform"
                          type="button"
                        >
                          <FaEye size={14} /> View Details
                        </button>

                        <button
                          disabled={isBusy}
                          onClick={() => toggleWishlist(tour.id)}
                          className={`w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md text-xs md:text-sm font-medium shadow transition-all ${
                            inWishlist
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-[#e6f4ed] text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white"
                          } ${isBusy ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
                          type="button"
                        >
                          {inWishlist ? <FaCheck size={14} /> : <FaHeart size={14} />}
                          {inWishlist ? "Added to Wishlist" : "Add to Wishlist"}
                        </button>

                        <button
                          onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-xs md:text-sm font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                          type="button"
                        >
                          <FaUsers size={14} /> Show All Agencies
                        </button>

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