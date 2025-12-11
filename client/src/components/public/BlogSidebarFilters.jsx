// client/src/components/public/BlogSidebarFilters.jsx
export default function BlogSidebarFilters({ filters, onChange, onReset }) {
  return (
    <aside className="w-full md:w-64 bg-[#0f3b24] text-white rounded-2xl p-4 md:p-5 flex flex-col gap-4">

      {/* Search */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Search Blogs</h3>
        <input
          type="text"
          value={filters.search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search using keywords..."
          className="w-full h-9 rounded-md px-3 text-xs text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* Quick Filters */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Quick Filters</h3>

        {/* Top Agencies */}
        <button
          onClick={() =>
            onChange({
              ...filters,
              sort:
                filters.sort === "top-agencies" ? "" : "top-agencies",
            })
          }
          className={`w-full h-9 rounded-md text-xs font-medium flex items-center gap-2 px-3 border ${
            filters.sort === "top-agencies"
              ? "bg-emerald-400 text-[#0f3b24] border-transparent"
              : "bg-white text-gray-800 border-gray-200"
          }`}
        >
          🏆 Top Agencies
        </button>

        {/* Latest */}
        <button
          onClick={() => onChange({ ...filters, sort: filters.sort === "latest" ? "" : "latest" })}
          className={`mt-2 w-full h-9 rounded-md text-xs font-medium flex items-center gap-2 px-3 border ${
            filters.sort === "latest"
              ? "bg-emerald-400 text-[#0f3b24] border-transparent"
              : "bg-white text-gray-800 border-gray-200"
          }`}
        >
          🕒 Latest
        </button>

        {/* RESET directly under filters */}
        <button
          onClick={onReset}
          className="mt-3 w-full h-9 rounded-md border border-emerald-200 text-xs font-medium hover:bg-emerald-500 hover:text-white transition"
        >
          Reset
        </button>
      </div>

    </aside>
  );
}
