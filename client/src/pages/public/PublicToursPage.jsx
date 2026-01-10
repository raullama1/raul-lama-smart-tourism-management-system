import { useEffect, useState } from "react";
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

  const [filters, setFilters] = useState({
    search: "",
    location: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    // "" | "popular" | "price-asc" | "price-desc"
    sort: "", // Default = random
    page: 1,
    limit: 6,
  });

  const [tours, setTours] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);

  const loadTours = async (overridePage) => {
    try {
      setLoading(true);

      const query = {
        ...filters,
        page: overridePage || filters.page,
      };

      const res = await fetchPublicTours(query);

      if (overridePage && overridePage > 1) {
        setTours((prev) => [...prev, ...res.data]);
      } else {
        setTours(res.data);
      }

      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load tours", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTours(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.location,
    filters.type,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
  ]);

  const handleFiltersChange = (next) => {
    setFilters((prev) => ({
      ...prev,
      ...next,
      page: 1,
    }));
  };

  const handleSearchClick = () => {
    loadTours(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      location: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
      page: 1,
      limit: 6,
    });
  };

  const handleLoadMore = () => {
    if (!pagination.hasMore) return;
    const nextPage = (filters.page || 1) + 1;
    setFilters((prev) => ({ ...prev, page: nextPage }));
    loadTours(nextPage);
  };

  const Navbar = isAuthed ? NavbarTourist : NavbarPublic;
  const Footer = isAuthed ? FooterTourist : FooterPublic;

  return (
    <>
      <Navbar />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <header className="mb-4">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              All Tours
            </h1>
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
            <TourSidebarFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />

            {loading ? (
              <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-100 py-10">
                <span className="text-sm text-gray-500">Loading tours...</span>
              </div>
            ) : (
              <TourGrid tours={tours} isAuthed={isAuthed} />
            )}
          </section>

          <div className="mt-6 flex justify-center">
            {pagination.hasMore && (
              <button
                onClick={handleLoadMore}
                className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-sm text-gray-800 hover:bg-gray-50"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
