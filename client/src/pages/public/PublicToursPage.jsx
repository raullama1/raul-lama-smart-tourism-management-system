// client/src/pages/public/PublicToursPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiLock, FiX } from "react-icons/fi";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import TourFiltersBar from "../../components/public/TourFiltersBar";
import TourSidebarFilters from "../../components/public/TourSidebarFilters";
import TourGrid from "../../components/public/TourGrid";
import { fetchPublicTours, fetchPublicTourSuggestions } from "../../api/tourApi";
import { useAuth } from "../../context/AuthContext";

export default function PublicToursPage() {
  const { token } = useAuth();
  const isAuthed = !!token;

  const userPagingRef = useRef(false);
  const firstLoadRef = useRef(true);

  const [filters, setFilters] = useState({
    search: "",
    location: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    sort: "",
    page: 1,
    limit: 6,
  });

  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(false);
  const [fadeState, setFadeState] = useState("out");
  const [loginPrompt, setLoginPrompt] = useState({
    open: false,
    message: "",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFadeState("in"), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loginPrompt.open) return undefined;

    const timer = window.setTimeout(() => {
      setLoginPrompt((prev) => ({
        ...prev,
        open: false,
      }));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [loginPrompt.open, loginPrompt.message]);

  const showLoginPrompt = useCallback((message) => {
    setLoginPrompt({
      open: true,
      message,
    });
  }, []);

  const closeLoginPrompt = useCallback(() => {
    setLoginPrompt((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const handleRequireLogin = useCallback(() => {
    if (!isAuthed) {
      showLoginPrompt("Please login or signup to use this feature.");
      return false;
    }

    return true;
  }, [isAuthed, showLoginPrompt]);

  const totalPages = useMemo(() => {
    const total = Number(pagination.total || 0);
    const limit = Number(filters.limit || 6);
    return Math.max(1, Math.ceil(total / limit));
  }, [pagination.total, filters.limit]);

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

  const loadTours = useCallback(
    async (query, { smoothSwap = false } = {}) => {
      try {
        if (smoothSwap) setFadeState("out");
        setLoading(true);

        const res = await fetchPublicTours(query);

        if (smoothSwap) {
          await new Promise((r) => setTimeout(r, 160));
        }

        setTours(res?.data || []);
        setPagination(res?.pagination || { total: 0 });

        requestAnimationFrame(() => setFadeState("in"));
      } catch (err) {
        console.error("Failed to load tours", err);
        requestAnimationFrame(() => setFadeState("in"));
      } finally {
        setLoading(false);
        firstLoadRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const query = {
      ...filters,
      page: 1,
    };

    const shouldResetPage = filters.page !== 1;
    const smooth = !firstLoadRef.current;

    if (shouldResetPage) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }

    loadTours(query, { smoothSwap: smooth });
  }, [
    filters.location,
    filters.type,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    loadTours,
  ]);

  useEffect(() => {
    const keyword = String(filters.search || "").trim();

    if (keyword.length < 1) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const res = await fetchPublicTourSuggestions(keyword);

        if (cancelled) return;
        setSuggestions(res?.data || []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load tour suggestions", err);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.search]);

  useEffect(() => {
    if (!userPagingRef.current) return;
    if (loading) return;

    scrollFullTop();
    userPagingRef.current = false;
  }, [filters.page, loading, scrollFullTop]);

  const handleFiltersChange = (next) => {
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));
  };

  const handleSearchClick = () => {
    const query = {
      ...filters,
      page: 1,
    };

    setFilters((prev) => ({ ...prev, page: 1 }));
    loadTours(query, { smoothSwap: true });
  };

  const handleSearchSelect = (title) => {
    const nextFilters = {
      ...filters,
      search: title,
      page: 1,
    };

    setFilters(nextFilters);
    setSuggestions([]);
    loadTours(nextFilters, { smoothSwap: true });
  };

  const handleClearFilters = () => {
    const cleared = {
      search: "",
      location: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
      page: 1,
      limit: 6,
    };

    setFilters(cleared);
    setSuggestions([]);
    loadTours(cleared, { smoothSwap: true });
  };

  const setSafePage = (next) => {
    const n = Math.min(totalPages, Math.max(1, next));
    if (n === filters.page) return;

    userPagingRef.current = true;

    const nextFilters = {
      ...filters,
      page: n,
    };

    setFilters(nextFilters);
    loadTours(nextFilters, { smoothSwap: true });
  };

  const Navbar = isAuthed ? NavbarTourist : NavbarPublic;
  const Footer = isAuthed ? FooterTourist : FooterPublic;
  const pageBg = isAuthed ? "#eef8f2" : "#e6f4ec";

  const pagerBtn =
    "px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-300 ease-out transform active:scale-95 shadow-sm hover:shadow-md";

  const pagerBtnEnabled =
    "bg-white text-gray-900 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 hover:-translate-y-0.5";

  const pagerBtnDisabled =
    "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none";

  const fadeWrapClass = fadeState === "in" ? "opacity-100" : "opacity-0";
  const transitionClass =
    "transition-opacity duration-700 ease-[cubic-bezier(.22,1,.36,1)]";

  return (
    <div className="relative bg-[#071510]">
      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <Footer />
        </div>

        <div className="relative z-10" style={{ backgroundColor: pageBg }}>
          <Navbar />

          <AnimatePresence>
            {loginPrompt.open ? (
              <motion.div
                initial={{ opacity: 0, y: -18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="fixed right-4 top-20 z-[90] w-[calc(100%-2rem)] max-w-sm md:right-6 md:top-24"
              >
                <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <FiLock className="text-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Login required
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {loginPrompt.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeLoginPrompt}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <FiX className="text-base" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <main className="min-h-screen pb-10 pt-6">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
                  All Tours
                </h1>
                <p className="text-xs text-gray-500 md:text-sm">
                  Discover guided experiences across Nepal
                </p>
              </motion.header>

              <TourFiltersBar
                filters={filters}
                suggestions={suggestions}
                suggestionsLoading={suggestionsLoading}
                onFiltersChange={handleFiltersChange}
                onSearchClick={handleSearchClick}
                onSearchSelect={handleSearchSelect}
                onClearFilters={handleClearFilters}
              />

              <section className="mt-4 flex flex-col gap-4 md:flex-row">
                <TourSidebarFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />

                <div className="flex-1">
                  <div className={`${transitionClass} ${fadeWrapClass}`}>
                    {loading && tours.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-10"
                      >
                        <span className="text-sm text-gray-500">Loading tours...</span>
                      </motion.div>
                    ) : (
                      <TourGrid tours={tours} onRequireLogin={handleRequireLogin} />
                    )}
                  </div>

                  {!loading && pagination.total > filters.limit && (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mt-8 flex justify-center"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSafePage(filters.page - 1)}
                          disabled={filters.page === 1}
                          className={`${pagerBtn} ${
                            filters.page === 1 ? pagerBtnDisabled : pagerBtnEnabled
                          }`}
                        >
                          Prev
                        </button>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm">
                          Page {filters.page} / {totalPages}
                        </div>

                        <button
                          onClick={() => setSafePage(filters.page + 1)}
                          disabled={filters.page === totalPages}
                          className={`${pagerBtn} ${
                            filters.page === totalPages
                              ? pagerBtnDisabled
                              : pagerBtnEnabled
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>
    </div>
  );
}