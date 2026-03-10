// seerver/pages/admin/AdminTouristsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiSearch, FiSliders, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  getAdminTourists,
  updateAdminTouristStatus,
} from "../../api/adminTouristsApi";

function StatusBadge({ blocked }) {
  return (
    <span
      className={`inline-flex rounded-xl px-3 py-1 text-[14px] font-semibold ${
        blocked
          ? "bg-red-100 text-red-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function ModalShell({ title, onClose, children, maxWidth = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-3xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-[22px] font-bold text-[#183128]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function TouristStatusModal({ tourist, onClose, onConfirm, submitting }) {
  if (!tourist) return null;

  const actionLabel = tourist.is_blocked ? "Unblock" : "Block";
  const actionText = tourist.is_blocked
    ? "This tourist will be able to use the system again."
    : "This tourist will be marked as blocked.";

  return (
    <ModalShell
      title={`${actionLabel} Tourist`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <p className="text-[16px] text-gray-700">
        Are you sure you want to{" "}
        <span className="font-semibold">{actionLabel.toLowerCase()}</span>{" "}
        <span className="font-semibold text-[#183128]">
          {tourist.name || tourist.email}
        </span>
        ?
      </p>

      <p className="mt-3 text-sm text-gray-500">{actionText}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
            tourist.is_blocked
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {submitting ? "Updating..." : actionLabel}
        </button>
      </div>
    </ModalShell>
  );
}

export default function AdminTouristsPage() {
  const navigate = useNavigate();

  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    sort: "newest",
  });

  const [statusTourist, setStatusTourist] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadTourists = useCallback(
    async (showRefresh = false, nextFilters = filters) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getAdminTourists({
          q: nextFilters.q,
          status: nextFilters.status,
          sort: nextFilters.sort,
        });

        setTourists(Array.isArray(data?.tourists) ? data.tourists : []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load tourists.";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      loadTourists(false, filters);
    }, 250);

    return () => clearTimeout(id);
  }, [filters, loadTourists]);

  const handleStatusUpdate = async () => {
    if (!statusTourist) return;

    try {
      setStatusSubmitting(true);

      await updateAdminTouristStatus(
        statusTourist.id,
        !statusTourist.is_blocked
      );

      setStatusTourist(null);
      await loadTourists(true, filters);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to update tourist status.";
      setError(msg);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { label: "Status: All", value: "all" },
      { label: "Status: Active", value: "active" },
      { label: "Status: Blocked", value: "blocked" },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { label: "Sort: Newest First", value: "newest" },
      { label: "Sort: Oldest First", value: "oldest" },
    ],
    []
  );

  return (
    <main className="h-screen overflow-hidden bg-[#f5f8f5]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="tourists" />

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-4">
          <div className="pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-[30px] leading-tight font-bold text-[#183128]">
                  Manage Tourists
                </h1>
                <p className="mt-1 text-[16px] font-semibold text-[#73917f]">
                  View and manage all tourist accounts
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadTourists(true, filters)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#06733f] px-5 py-3 text-[16px] font-semibold text-white hover:bg-[#056437] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FiRefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <div className="relative w-full max-w-md">
                <FiSearch
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, q: e.target.value }))
                  }
                  placeholder="Search name or email"
                  className="h-[44px] w-full rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[16px] font-semibold text-[#183128] placeholder:text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="relative w-full md:w-[180px]">
                <FiSliders
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                />
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="h-[44px] w-full appearance-none rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[16px] font-semibold text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full md:w-[210px]">
                <FiSliders
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                />
                <select
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sort: e.target.value }))
                  }
                  className="h-[44px] w-full appearance-none rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[16px] font-semibold text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#d7e3da] bg-white px-4 py-4 shadow-sm">
              {loading ? (
                <div className="rounded-xl border border-dashed border-[#d7e3da] px-4 py-10 text-center text-gray-500">
                  Loading tourists...
                </div>
              ) : tourists.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d7e3da] px-4 py-10 text-center text-gray-500">
                  No tourists found.
                </div>
              ) : (
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#dfe8e2]">
                      <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                        Tourist Name
                      </th>
                      <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                        Email
                      </th>
                      <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                        Signup Date
                      </th>
                      <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                        Status
                      </th>
                      <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tourists.map((tourist) => (
                      <tr
                        key={tourist.id}
                        className="border-b border-[#dfe8e2] last:border-b-0"
                      >
                        <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {tourist.name || "-"}
                        </td>
                        <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {tourist.email}
                        </td>
                        <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {tourist.created_at}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge blocked={tourist.is_blocked} />
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setStatusTourist(tourist)}
                              className="rounded-xl border border-[#d7e3da] bg-[#f5f8f5] px-4 py-2 text-[15px] font-semibold text-[#183128] hover:bg-[#edf5ef]"
                            >
                              {tourist.is_blocked ? "Unblock" : "Block"}
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/admin/tourists/${tourist.id}`)}
                              className="rounded-xl bg-[#06733f] px-4 py-2 text-[15px] font-semibold text-white hover:bg-[#056437]"
                            >
                              View in Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>

      <TouristStatusModal
        tourist={statusTourist}
        onClose={() => setStatusTourist(null)}
        onConfirm={handleStatusUpdate}
        submitting={statusSubmitting}
      />
    </main>
  );
}