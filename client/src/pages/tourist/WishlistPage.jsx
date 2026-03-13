// client/src/pages/tourist/WishlistPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { fetchWishlist } from "../../api/wishlistApi";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { FaEye, FaTrash, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

const PAGE_SIZE = 6;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WishlistPage() {
  const navigate = useNavigate();
  const { remove } = useWishlist();
  const { token } = useAuth();

  const userPagingRef = useRef(false);
  const firstLoadRef = useRef(true);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [fadeState, setFadeState] = useState("out");

  useEffect(() => {
    const t = setTimeout(() => setFadeState("in"), 40);
    return () => clearTimeout(t);
  }, []);

  const btnBase =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium " +
    "transition-all duration-300 ease-out transform hover:scale-[1.02] active:scale-95 " +
    "shadow-sm hover:shadow-md";

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  }, [items.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const scrollFullTop = useCallback(() => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 0.9 });
      return;
    }

    const start = window.scrollY || window.pageYOffset;
    const duration = 700;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    let startTime = null;

    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = easeOutCubic(progress);

      window.scrollTo(0, start * (1 - eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      if (!token) {
        setItems([]);
        setPage(1);
        requestAnimationFrame(() => setFadeState("in"));
        return;
      }

      const res = await fetchWishlist(token);

      setItems(res?.data || []);
      setPage(1);

      requestAnimationFrame(() => setFadeState("in"));
    } catch (e) {
      console.error("Failed to load wishlist", e);
      requestAnimationFrame(() => setFadeState("in"));
    } finally {
      setLoading(false);
      firstLoadRef.current = false;
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userPagingRef.current) return;
    if (loading) return;

    scrollFullTop();
    userPagingRef.current = false;
  }, [page, loading, scrollFullTop]);

  const setSafePage = useCallback(
    async (next) => {
      const n = Math.min(totalPages, Math.max(1, next));
      if (n === page) return;

      userPagingRef.current = true;
      setFadeState("out");
      await new Promise((r) => setTimeout(r, 150));
      setPage(n);
      requestAnimationFrame(() => setFadeState("in"));
    },
    [totalPages, page]
  );

  const handleRemove = async (tourId) => {
    const result = await remove(tourId);
    if (!result?.ok) return;

    setItems((prev) => {
      const next = prev.filter((x) => x.id !== tourId);
      const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage((p) => Math.min(p, nextTotalPages));
      return next;
    });
  };

  const pagerBtn =
    "inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold border " +
    "transition-all duration-300 ease-out transform active:scale-95 shadow-sm hover:shadow-md";

  const pagerBtnEnabled =
    "bg-white text-gray-900 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 hover:-translate-y-0.5";

  const pagerBtnDisabled =
    "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none";

  const fadeWrapClass = fadeState === "in" ? "opacity-100" : "opacity-0";
  const transitionClass =
    "transition-opacity duration-500 ease-[cubic-bezier(.22,1,.36,1)]";

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm"
          >
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Wishlist
            </h1>
            <p className="text-xs md:text-sm text-emerald-700 mt-1">
              Saved experiences across Nepal: mountains, jungles, heritage cities.
            </p>
          </motion.div>

          <div className="mt-5">
            {!token ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="bg-white rounded-2xl border border-gray-100 p-10 text-center"
              >
                <div className="text-gray-900 font-semibold">
                  Please login to view your wishlist
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Your wishlist is saved in your account.
                </div>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Go to Login
                </motion.button>
              </motion.div>
            ) : (
              <>
                <div className={`${transitionClass} ${fadeWrapClass}`}>
                  {loading && items.length === 0 ? (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500"
                    >
                      Loading wishlist...
                    </motion.div>
                  ) : items.length === 0 ? (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      className="bg-white rounded-2xl border border-gray-100 p-10 text-center"
                    >
                      <div className="text-gray-900 font-semibold">
                        No wishlist yet
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Add tours from the Tours page and they will appear here.
                      </div>
                      <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate("/tours")}
                        className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        Browse Tours
                      </motion.button>
                    </motion.div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={page}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -18 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      >
                        {pageItems.map((tour, index) => {
                          const agencyCount = Number(tour.agency_count || 0);
                          const hasMultipleAgencies = agencyCount > 1;

                          return (
                            <motion.article
                              key={tour.id}
                              initial={{ opacity: 0, y: 22 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.35,
                                delay: index * 0.05,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                            >
                              <div className="h-44 w-full overflow-hidden">
                                <img
                                  src={toPublicImageUrl(tour.image_url) || FALLBACK_TOUR_IMG}
                                  alt={tour.title}
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.04]"
                                  onError={(e) => {
                                    e.currentTarget.src = FALLBACK_TOUR_IMG;
                                  }}
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
                                  <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 transition-colors duration-300">
                                    {agencyCount} {agencyCount === 1 ? "agency" : "agencies"}
                                  </span>

                                  {hasMultipleAgencies ? (
                                    <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 font-medium transition-colors duration-300">
                                      Multiple
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium transition-colors duration-300">
                                      Single
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
                            </motion.article>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {items.length > PAGE_SIZE && !loading && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    className="mt-7 flex items-center justify-center gap-3"
                  >
                    <button
                      onClick={() => setSafePage(page - 1)}
                      disabled={page === 1}
                      className={`${pagerBtn} ${page === 1 ? pagerBtnDisabled : pagerBtnEnabled}`}
                      aria-label="Previous page"
                    >
                      Prev
                    </button>

                    <motion.div
                      key={page}
                      initial={{ scale: 0.96, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-sm"
                    >
                      Page {page} / {totalPages}
                    </motion.div>

                    <button
                      onClick={() => setSafePage(page + 1)}
                      disabled={page === totalPages}
                      className={`${pagerBtn} ${
                        page === totalPages ? pagerBtnDisabled : pagerBtnEnabled
                      }`}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}