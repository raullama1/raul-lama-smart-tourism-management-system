// client/src/components/public/BlogSidebarFilters.jsx
import {
  FiClock,
  FiCalendar,
  FiAward,
  FiRotateCcw,
  FiSearch,
} from "react-icons/fi";

const BLOG_TYPES = [
  "Adventure",
  "Nature",
  "Heritage",
  "Religious",
  "Wildlife",
];

export default function BlogSidebarFilters({ filters, onChange, onReset }) {
  return (
    <aside className="rounded-[1.8rem] border border-emerald-950/10 bg-[#103923] p-4 text-white shadow-[0_22px_60px_rgba(15,23,42,0.12)] md:p-5">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
          Filter Blogs
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-white">
          Search
        </label>
        <div className="relative">
          <FiSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/70"
            size={15}
          />
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search blogs..."
            className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/25"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-white">
          Type
        </label>
        <select
          value={filters.type || ""}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
          className="h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/25"
        >
          <option value="" className="text-slate-900">
            All type
          </option>
          {BLOG_TYPES.map((type) => (
            <option key={type} value={type} className="text-slate-900">
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Quick Filters</h3>

        <div className="space-y-2.5">
          <button
            onClick={() =>
              onChange({
                ...filters,
                sort: filters.sort === "latest" ? "" : "latest",
              })
            }
            className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
              filters.sort === "latest"
                ? "bg-emerald-400 text-[#0f3b24]"
                : "bg-white text-slate-800 hover:bg-emerald-50"
            }`}
            type="button"
          >
            <FiClock size={16} />
            Latest
          </button>

          <button
            onClick={() =>
              onChange({
                ...filters,
                sort: filters.sort === "oldest" ? "" : "oldest",
              })
            }
            className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
              filters.sort === "oldest"
                ? "bg-emerald-400 text-[#0f3b24]"
                : "bg-white text-slate-800 hover:bg-emerald-50"
            }`}
            type="button"
          >
            <FiCalendar size={16} />
            Oldest
          </button>

          <button
            onClick={() =>
              onChange({
                ...filters,
                sort: filters.sort === "top-agencies" ? "" : "top-agencies",
              })
            }
            className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
              filters.sort === "top-agencies"
                ? "bg-emerald-400 text-[#0f3b24]"
                : "bg-white text-slate-800 hover:bg-emerald-50"
            }`}
            type="button"
          >
            <FiAward size={16} />
            Top Agencies
          </button>
        </div>

        <button
          onClick={onReset}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200/20 bg-transparent text-sm font-medium text-emerald-50 transition hover:bg-white/10"
          type="button"
        >
          <FiRotateCcw size={16} />
          Reset
        </button>
      </div>
    </aside>
  );
}