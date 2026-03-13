// client/src/components/public/TourCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Draggable } from "gsap/all";
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
  cardWidth = "w-[18rem] md:w-[19rem] lg:w-[20rem]",
  onRequireLogin,
  onWishlistChanged,
}) {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const draggableRef = useRef(null);
  const resizeObsRef = useRef(null);

  const navigate = useNavigate();
  const { token } = useAuth();

  const [dims, setDims] = useState({
    itemW: 304,
    gap: 18,
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

    const itemW = firstCard.getBoundingClientRect().width || 304;

    const styles = getComputedStyle(container);
    const gapStr = styles.gap || styles.columnGap || "0";
    const gap = Number.parseFloat(gapStr) || 18;

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
    if (!container || !dims.ready || !dims.segmentW || !repeatedBaseTours.length) {
      return;
    }

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
      duration: 0.38,
      ease: "power2.out",
      onUpdate: applyWrap,
      onComplete: applyWrap,
    });
  };

  const scrollLeft = () => moveBy(dims.itemW + dims.gap);
  const scrollRight = () => moveBy(-(dims.itemW + dims.gap));

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-8 md:py-12"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {showSectionHeader && (
          <div className="mb-5 flex items-center justify-between gap-4 md:mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              {sectionTitle}
            </h2>
          </div>
        )}

        <div className="relative md:px-10">
          <motion.button
            whileHover={{ scale: 1.05, x: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={scrollLeft}
            className="absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all md:inline-flex"
            type="button"
            aria-label="Previous"
            title="Previous"
          >
            <FaChevronLeft size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, x: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={scrollRight}
            className="absolute -right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all md:inline-flex"
            type="button"
            aria-label="Next"
            title="Next"
          >
            <FaChevronRight size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all md:hidden"
            type="button"
            aria-label="Previous"
            title="Previous"
          >
            <FaChevronLeft size={14} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={scrollRight}
            className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all md:hidden"
            type="button"
            aria-label="Next"
            title="Next"
          >
            <FaChevronRight size={14} />
          </motion.button>

          <div
            ref={viewportRef}
            className="overflow-hidden rounded-[1.8rem] bg-white/70 p-2 md:p-3"
          >
            <div
              ref={containerRef}
              className="flex gap-4 md:gap-[18px]"
              style={{ width: "max-content", alignItems: "stretch" }}
            >
              {tripledTours.map((tour, idx) => {
                const idNum = Number(tour.id);
                const inWishlist = wishlistIds.has(idNum);
                const isBusy = busyId === idNum;
                const imgSrc = toPublicImageUrl(tour.image) || FALLBACK_TOUR_IMG;

                return (
                  <motion.div
                    key={`${tour.id}-${idx}`}
                    data-tour-card="true"
                    className={`flex-shrink-0 ${cardWidth}`}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.42, delay: (idx % 6) * 0.03 }}
                  >
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.22 }}
                      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={tour.title}
                          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] md:h-48"
                          draggable="false"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_TOUR_IMG;
                          }}
                        />

                        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                          {tour.type || "Tour"}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="line-clamp-2 text-base font-semibold text-slate-900 md:text-[17px]">
                          {tour.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <span className="line-clamp-1">{tour.location}</span>
                          <span className="text-slate-300">•</span>
                          <span className="line-clamp-1">{tour.type}</span>
                        </div>

                        <div className="mt-4">
                          <span className="text-sm text-slate-500">From </span>
                          <span className="text-lg font-bold text-emerald-700">
                            Rs {Number(tour.price || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/tours/${tour.id}`)}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-800 md:text-sm"
                            type="button"
                          >
                            <FaEye size={13} />
                            View Details
                          </motion.button>

                          <motion.button
                            whileHover={isBusy ? {} : { y: -1 }}
                            whileTap={isBusy ? {} : { scale: 0.98 }}
                            disabled={isBusy}
                            onClick={() => toggleWishlist(tour.id)}
                            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all md:text-sm ${
                              inWishlist
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            } ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
                            type="button"
                          >
                            {inWishlist ? <FaCheck size={13} /> : <FaHeart size={13} />}
                            {inWishlist ? "Added" : "Wishlist"}
                          </motion.button>

                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 md:text-sm"
                            type="button"
                          >
                            <FaUsers size={13} />
                            Agencies
                          </motion.button>

                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (!requireLogin()) return;
                              navigate(`/map?tour=${tour.id}`);
                            }}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 md:text-sm"
                            type="button"
                          >
                            <FaMapMarkerAlt size={13} />
                            Map View
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}

              {normalizedTours.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No tours available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}