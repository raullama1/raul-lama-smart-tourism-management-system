// client/src/components/public/TourSidebarFilters.jsx
import { motion } from "framer-motion";

export default function TourSidebarFilters({ filters, onFiltersChange }) {
  const setType = (type) =>
    onFiltersChange({ ...filters, type: filters.type === type ? "" : type });

  const setPriceRange = (rangeKey) => {
    let minPrice = "";
    let maxPrice = "";
    if (rangeKey === "under-10k") {
      maxPrice = 10000;
    } else if (rangeKey === "10-25k") {
      minPrice = 10000;
      maxPrice = 25000;
    } else if (rangeKey === "25-50k") {
      minPrice = 25000;
      maxPrice = 50000;
    } else if (rangeKey === "above-50k") {
      minPrice = 50000;
    }
    onFiltersChange({ ...filters, minPrice, maxPrice });
  };

  const activeTypeClass = (type) =>
    `px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-300 ${
      filters.type === type
        ? "bg-emerald-600 text-white border-emerald-600"
        : "bg-white text-gray-800 border-gray-300 hover:bg-emerald-50"
    }`;

  const activePriceClass = (min, max) => {
    const isActive =
      (filters.minPrice || "") === min && (filters.maxPrice || "") === max;
    return `w-full text-left px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-300 ${
      isActive
        ? "bg-emerald-600 text-white border-emerald-600"
        : "bg-white text-gray-800 border-gray-300 hover:bg-emerald-50"
    }`;
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full md:w-64 bg-[#e6f4ec] rounded-2xl p-4 self-start"
    >
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Tour Types
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={activeTypeClass("Adventure")}
            onClick={() => setType("Adventure")}
          >
            Adventure
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={activeTypeClass("Cultural")}
            onClick={() => setType("Cultural")}
          >
            Cultural
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={activeTypeClass("Nature")}
            onClick={() => setType("Nature")}
          >
            Nature
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={activeTypeClass("Religious")}
            onClick={() => setType("Religious")}
          >
            Religious
          </motion.button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Price
        </h3>
        <div className="mt-2 space-y-2">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={activePriceClass("", 10000)}
            onClick={() => setPriceRange("under-10k")}
          >
            Under NPR 10k
          </motion.button>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={activePriceClass(10000, 25000)}
            onClick={() => setPriceRange("10-25k")}
          >
            NPR 10k–25k
          </motion.button>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={activePriceClass(25000, 50000)}
            onClick={() => setPriceRange("25-50k")}
          >
            NPR 25k–50k
          </motion.button>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={activePriceClass(50000, "")}
            onClick={() => setPriceRange("above-50k")}
          >
            Above NPR 50k
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}