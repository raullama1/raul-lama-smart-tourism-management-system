// client/src/components/public/TourFiltersBar.jsx
import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { Range, getTrackBackground } from "react-range";

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
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            placeholder="Search by tour or destination"
            className="w-full h-11 md:h-12 rounded-xl border border-gray-300 px-4 pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <button
          onClick={onSearchClick}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Location:</span>
          <select
            value={filters.location || "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                location: e.target.value === "all" ? "" : e.target.value,
              })
            }
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs md:text-sm"
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
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
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
                    className="h-4 w-4 rounded-full bg-emerald-600 shadow"
                  />
                );
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Rs {priceValues[0].toLocaleString()}</span>
              <span>Rs {priceValues[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Type:</span>
          <select
            value={filters.type || "any"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                type: e.target.value === "any" ? "" : e.target.value,
              })
            }
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs md:text-sm"
          >
            <option value="any">Any</option>
            <option value="Adventure">Adventure</option>
            <option value="Cultural">Cultural</option>
            <option value="Nature">Nature</option>
            <option value="Religious">Religious</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Sort:</span>
          <select
            value={filters.sort || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, sort: e.target.value })
            }
            className="h-10 rounded-xl border border-gray-300 px-3 text-xs md:text-sm"
          >
            <option value="">Default</option>
            <option value="popular">Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <button
          onClick={onClearFilters}
          className="ml-auto px-3 py-2 rounded-xl border border-gray-300 text-xs md:text-sm text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
