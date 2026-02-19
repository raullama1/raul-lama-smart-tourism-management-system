import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";

import TourFiltersBar from "../../components/public/TourFiltersBar";
import TourSidebarFilters from "../../components/public/TourSidebarFilters";
import TourGrid from "../../components/public/TourGrid";
import { fetchPublicTours } from "../../api/tourApi";
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

  useEffect(() => {
    const t = setTimeout(() => setFadeState("in"), 40);
    return () => clearTimeout(t);
  }, []);

  const totalPages = useMemo(() => {
    const total = Number(pagination.total || 0);
    const limit = Number(filters.limit || 6);
    return Math.max(1, Math.ceil(total / limit));
  }, [pagination.total, filters.limit]);

  const scrollFullTop = useCallback(() => {
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
    async (overridePage, { smoothSwap = false } = {}) => {
      try {
        if (smoothSwap) setFadeState("out");
        setLoading(true);

        const query = {
          ...filters,
          page: overridePage || filters.page,
        };

        const res = await fetchPublicTours(query);

        // Only for user-triggered swap (paging/filters/search/clear)
        if (smoothSwap) await new Promise((r) => setTimeout(r, 160));

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
    [filters]
  );

  // First mount + server-relevant filter changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));

    // First load should be fast (no artificial delay)
    const smooth = !firstLoadRef.current;
    loadTours(1, { smoothSwap: smooth });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.location, filters.type, filters.minPrice, filters.maxPrice, filters.sort]);

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
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadTours(1, { smoothSwap: true });
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
    loadTours(1, { smoothSwap: true });
  };

  const setSafePage = (next) => {
    const n = Math.min(totalPages, Math.max(1, next));
    if (n === filters.page) return;

    userPagingRef.current = true;
    setFilters((prev) => ({ ...prev, page: n }));
    loadTours(n, { smoothSwap: true });
  };

  const Navbar = isAuthed ? NavbarTourist : NavbarPublic;
  const Footer = isAuthed ? FooterTourist : FooterPublic;

  const pagerBtn =
    "px-4 py-2.5 rounded-2xl text-sm font-semibold border " +
    "transition-all duration-300 ease-out transform active:scale-95 shadow-sm hover:shadow-md";

  const pagerBtnEnabled =
    "bg-white text-gray-900 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 hover:-translate-y-0.5";

  const pagerBtnDisabled =
    "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none";

  const fadeWrapClass = fadeState === "in" ? "opacity-100" : "opacity-0";
  const transitionClass =
    "transition-opacity duration-700 ease-[cubic-bezier(.22,1,.36,1)]";

  return (
    <>
      <Navbar />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <header className="mb-4">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">All Tours</h1>
            <p className="text-xs md:text-sm text-gray-500">
              Discover guided experiences across Nepal
            </p>
          </header>

          <TourFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearchClick={handleSearchClick}
            onClearFilters={handleClearFilters}
          />

          <section className="mt-4 flex flex-col md:flex-row gap-4">
            <TourSidebarFilters filters={filters} onFiltersChange={handleFiltersChange} />

            <div className="flex-1">
              <div className={`${transitionClass} ${fadeWrapClass}`}>
                {loading && tours.length === 0 ? (
                  <div className="flex items-center justify-center bg-white rounded-2xl border border-gray-100 py-10">
                    <span className="text-sm text-gray-500">Loading tours...</span>
                  </div>
                ) : (
                  <TourGrid tours={tours} isAuthed={isAuthed} />
                )}
              </div>

              {!loading && pagination.total > filters.limit && (
                <div className="mt-8 flex justify-center">
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

                    <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-sm">
                      Page {filters.page} / {totalPages}
                    </div>

                    <button
                      onClick={() => setSafePage(filters.page + 1)}
                      disabled={filters.page === totalPages}
                      className={`${pagerBtn} ${
                        filters.page === totalPages ? pagerBtnDisabled : pagerBtnEnabled
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
