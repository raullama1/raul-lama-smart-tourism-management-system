// client/src/components/public/TourFiltersBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Range, getTrackBackground } from "react-range";
import { AnimatePresence, motion } from "framer-motion";

const STEP = 1000;
const MIN = 10000;
const MAX = 200000;

export default function TourFiltersBar({
  filters,
  suggestions = [],
  suggestionsLoading = false,
  onFiltersChange,
  onSearchClick,
  onSearchSelect,
  onClearFilters,
}) {
  const [priceValues, setPriceValues] = useState([
    filters.minPrice || MIN,
    filters.maxPrice || MAX,
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setPriceValues([filters.minPrice || MIN, filters.maxPrice || MAX]);
  }, [filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const visibleSuggestions = useMemo(() => {
    if (!String(filters.search || "").trim()) return [];
    return suggestions.slice(0, 8);
  }, [filters.search, suggestions]);

  const handlePriceChange = (values) => {
    setPriceValues(values);
    onFiltersChange({
      ...filters,
      minPrice: values[0],
      maxPrice: values[1],
    });
  };

  const handleInputChange = (e) => {
    onFiltersChange({
      ...filters,
      search: e.target.value,
    });
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (String(filters.search || "").trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionMouseDown = (title) => {
    onSearchSelect(title);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSuggestions(false);
      onSearchClick();
      searchInputRef.current?.blur();
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 mb-6 space-y-3 overflow-visible"
    >
      <div className="relative z-30 flex items-start gap-2">
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ duration: 0.18 }}
          className="relative flex-1"
          ref={wrapperRef}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={filters.search || ""}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search by tour title"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-gray-300 px-4 pr-10 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:h-12 md:text-base"
          />

          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-300" />

          <AnimatePresence>
            {showSuggestions && String(filters.search || "").trim() ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[999] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]"
              >
                {suggestionsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Searching tours...
                  </div>
                ) : visibleSuggestions.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto py-2">
                    {visibleSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={() => handleSuggestionMouseDown(item.title)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {item.location || "Nepal"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No matching tour titles found.
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <motion.button
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowSuggestions(false);
            onSearchClick();
          }}
          className="hidden items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black md:inline-flex"
        >
          Search
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="relative z-10 flex flex-wrap items-center gap-3"
      >
        <motion.div whileHover={{ y: -1 }} className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Location:</span>
          <select
            value={filters.location || "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                location: e.target.value === "all" ? "" : e.target.value,
              })
            }
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:text-sm"
          >
            <option value="all">All Nepal</option>
            <option value="Kathmandu">Kathmandu</option>
            <option value="Bhaktapur">Bhaktapur</option>
            <option value="Pokhara">Pokhara</option>
            <option value="Chitwan">Chitwan</option>
            <option value="Lumbini">Lumbini</option>
            <option value="Annapurna Region">Annapurna Region</option>
            <option value="Solukhumbu">Solukhumbu</option>
          </select>
        </motion.div>

        <motion.div
          whileHover={{ y: -1 }}
          className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
        >
          <span className="text-xs font-medium text-gray-600">Price Range</span>

          <div className="w-44 md:w-56">
            <Range
              step={STEP}
              min={MIN}
              max={MAX}
              values={priceValues}
              onChange={handlePriceChange}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "6px",
                    width: "100%",
                    background: getTrackBackground({
                      values: priceValues,
                      colors: ["#d1d5db", "#10b981", "#d1d5db"],
                      min: MIN,
                      max: MAX,
                    }),
                    borderRadius: "4px",
                  }}
                  className="mt-1"
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => {
                const { key, ...rest } = props;
                return (
                  <div
                    key={key}
                    {...rest}
                    className="h-4 w-4 rounded-full bg-emerald-600 shadow transition-transform duration-200 hover:scale-110"
                  />
                );
              }}
            />
            <div className="mt-1 flex justify-between text-[10px] text-gray-500">
              <span>Rs {priceValues[0].toLocaleString()}</span>
              <span>Rs {priceValues[1].toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -1 }} className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Type:</span>
          <select
            value={filters.type || "any"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                type: e.target.value === "any" ? "" : e.target.value,
              })
            }
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:text-sm"
          >
            <option value="any">Any</option>
            <option value="Adventure">Adventure</option>
            <option value="Cultural">Cultural</option>
            <option value="Nature">Nature</option>
            <option value="Religious">Religious</option>
          </select>
        </motion.div>

        <motion.div whileHover={{ y: -1 }} className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Sort:</span>
          <select
            value={filters.sort || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, sort: e.target.value })
            }
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:text-sm"
          >
            <option value="">Default</option>
            <option value="popular">Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </motion.div>

        <motion.button
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowSuggestions(false);
            onClearFilters();
          }}
          className="ml-auto rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-50 md:text-sm"
        >
          Clear Filters
        </motion.button>
      </motion.div>
    </motion.div>
  );
}