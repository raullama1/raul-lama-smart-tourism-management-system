// client/src/pages/admin/AdminDashboardPage.jsx
import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiStar } from "react-icons/fi";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getAdminDashboard } from "../../api/adminDashboardApi";

function formatNepalCurrency(value) {
  const amount = Number(value || 0);
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#d7e3da] bg-white px-4 py-4 shadow-sm">
      <p className="text-[15px] font-semibold text-[#73917f]">{label}</p>
      <p className="mt-3 text-[26px] leading-none font-bold text-[#193128]">
        {value}
      </p>
    </div>
  );
}

function RankedList({ title, rightLabel, items, showRatingIcon = false, emptyText }) {
  return (
    <div className="rounded-2xl border border-[#d7e3da] bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold text-[#73917f]">{title}</h3>
        <p className="text-[14px] font-semibold text-[#73917f]">{rightLabel}</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#d7e3da] px-4 py-6 text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 divide-y divide-[#dfe8e2]">
          {items.map((item) => (
            <div
              key={`${title}-${item.rank}-${item.name}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-30 w-30 min-h-[30px] min-w-[30px] rounded-[10px] bg-[#e7f1eb] flex items-center justify-center text-[16px] font-bold text-[#1f4737]">
                  {item.rank}
                </div>
                <p className="truncate text-[16px] md:text-[17px] font-semibold text-[#1b2f28]">
                  {item.name}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-[15px] font-semibold text-[#73917f]">
                <span>{item.value}</span>
                {showRatingIcon ? <FiStar size={15} /> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getActivityBadgeClass(type) {
  if (type === "Paid") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (type === "Approved") {
    return "bg-blue-100 text-blue-800";
  }
  if (type === "Pending") {
    return "bg-amber-100 text-amber-800";
  }
  if (type === "Cancelled") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-700";
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState({
    stats: {
      totalTourists: 0,
      totalAgencies: 0,
      totalBookings: 0,
      totalPayments: 0,
      activeTours: 0,
    },
    popularTours: [],
    topRatedAgencies: [],
    latestActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await getAdminDashboard();

      setDashboard({
        stats: data?.stats || {
          totalTourists: 0,
          totalAgencies: 0,
          totalBookings: 0,
          totalPayments: 0,
          activeTours: 0,
        },
        popularTours: Array.isArray(data?.popularTours) ? data.popularTours : [],
        topRatedAgencies: Array.isArray(data?.topRatedAgencies)
          ? data.topRatedAgencies
          : [],
        latestActivity: Array.isArray(data?.latestActivity) ? data.latestActivity : [],
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to load admin dashboard.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = [
    {
      label: "Total Tourists",
      value: Number(dashboard.stats.totalTourists || 0).toLocaleString("en-IN"),
    },
    {
      label: "Total Agencies",
      value: Number(dashboard.stats.totalAgencies || 0).toLocaleString("en-IN"),
    },
    {
      label: "Total Bookings",
      value: Number(dashboard.stats.totalBookings || 0).toLocaleString("en-IN"),
    },
    {
      label: "Total Payments",
      value: formatNepalCurrency(dashboard.stats.totalPayments || 0),
    },
    {
      label: "Active Tours",
      value: Number(dashboard.stats.activeTours || 0).toLocaleString("en-IN"),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f8f5]">
      <div className="flex flex-col lg:flex-row min-h-screen">
        <AdminSidebar active="dashboard" />

        <section className="flex-1 px-5 py-5 md:px-6 md:py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-[30px] leading-tight font-bold text-[#183128]">
                Admin Dashboard
              </h1>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#06733f] px-5 py-3 text-[16px] font-semibold text-white hover:bg-[#056437] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiRefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 rounded-2xl border border-[#d7e3da] bg-white px-6 py-10 text-center text-gray-600 shadow-sm">
              Loading dashboard...
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map((item) => (
                  <SummaryCard key={item.label} label={item.label} value={item.value} />
                ))}
              </div>

              <div className="mt-6">
                <h2 className="text-[18px] font-bold text-[#183128]">Key Lists</h2>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <RankedList
                    title="Popular Tours"
                    rightLabel="Last 30 days"
                    items={dashboard.popularTours}
                    emptyText="No successful booking data available yet."
                  />

                  <RankedList
                    title="Top Rated Agencies"
                    rightLabel="Average rating"
                    items={dashboard.topRatedAgencies}
                    showRatingIcon
                    emptyText="No review data available yet."
                  />
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-[18px] font-bold text-[#183128]">
                  Latest Activity
                </h2>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-[#d7e3da] bg-white px-4 py-4 shadow-sm">
                  {dashboard.latestActivity.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#d7e3da] px-4 py-6 text-sm text-gray-500">
                      No recent activity found.
                    </div>
                  ) : (
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#dfe8e2]">
                          <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                            Status
                          </th>
                          <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                            Reference
                          </th>
                          <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                            Details
                          </th>
                          <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                            Time
                          </th>
                          <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {dashboard.latestActivity.map((item, index) => (
                          <tr
                            key={`${item.reference}-${index}`}
                            className="border-b border-[#dfe8e2] last:border-b-0"
                          >
                            <td className="px-3 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${getActivityBadgeClass(
                                  item.type
                                )}`}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                              {item.reference}
                            </td>
                            <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                              {item.details}
                            </td>
                            <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                              {item.time}
                            </td>
                            <td className="px-3 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                              {formatNepalCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}