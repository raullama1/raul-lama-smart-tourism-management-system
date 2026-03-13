// client/src/components/public/TourFiltersBar.jsx
import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { Range, getTrackBackground } from "react-range";
import { motion } from "framer-motion";

const STEP = 1000;
const MIN = 10000;
const MAX = 200000;

export default function TourFiltersBar({
  filters,
  onFiltersChange,
  onSearchClick,
  onClearFilters,
}) {
  const [priceValues, setPriceValues] = useState([
    filters.minPrice || MIN,
    filters.maxPrice || MAX,
  ]);

  useEffect(() => {
    setPriceValues([filters.minPrice || MIN, filters.maxPrice || MAX]);
  }, [filters.minPrice, filters.maxPrice]);

  const handlePriceChange = (values) => {
    setPriceValues(values);
    onFiltersChange({
      ...filters,
      minPrice: values[0],
      maxPrice: values[1],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 space-y-3"
    >
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ duration: 0.18 }}
          className="relative flex-1"
        >
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            placeholder="Search by tour or destination"
            className="w-full h-11 md:h-12 rounded-xl border border-gray-300 px-4 pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-300 group-focus-within:scale-110" />
        </motion.div>

        <motion.button
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSearchClick}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition"
        >
          Search
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="flex flex-wrap gap-3 items-center"
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
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs md:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3"
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
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
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
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs md:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs md:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          onClick={onClearFilters}
          className="ml-auto px-3 py-2 rounded-xl border border-gray-300 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Clear Filters
        </motion.button>
      </motion.div>
    </motion.div>
  );
}