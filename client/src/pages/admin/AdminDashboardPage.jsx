// client/src/pages/admin/AdminDashboardPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiRefreshCw,
  FiStar,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminDashboard } from "../../api/adminDashboardApi";

function formatNepalCurrency(value) {
  const amount = Number(value || 0);
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

function SummaryCard({ label, value, icon: Icon, delay = 0 }) {
  return (
    <div
      className="group relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_10px_35px_rgba(16,24,40,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(16,24,40,0.14)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,115,63,0.12),_transparent_42%)]" />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#06733f]/8 blur-2xl transition duration-300 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6c8b79]">
            {label}
          </p>
          <p className="mt-4 text-[28px] font-bold leading-none text-[#163328] sm:text-[32px]">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d7e3da] bg-[#f4fbf7] text-[#06733f] shadow-sm">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function RankedList({
  title,
  rightLabel,
  items,
  showRatingIcon = false,
  emptyText,
  icon: Icon,
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_35px_rgba(16,24,40,0.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(6,115,63,0.08),_transparent_36%)]" />
      <div className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7e3da] bg-[#f3faf6] text-[#06733f]">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#193128]">{title}</h3>
              <p className="text-[13px] font-medium text-[#73917f]">{rightLabel}</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#d7e3da] bg-[#fbfdfb] px-4 py-8 text-sm text-gray-500">
            {emptyText}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div
                key={`${title}-${item.rank}-${item.name}-${index}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#edf2ee] bg-[#fbfdfb] px-4 py-4 transition duration-300 hover:border-[#cfe0d4] hover:bg-white hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#06733f] to-[#0b8c4f] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(6,115,63,0.22)]">
                    {item.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#1b2f28] sm:text-[16px]">
                      {item.name}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-[#d7e3da] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#486758]">
                  <span className="inline-flex items-center gap-1">
                    {item.value}
                    {showRatingIcon ? <FiStar size={14} className="text-[#f59e0b]" /> : null}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getActivityBadgeClass(type) {
  if (type === "Paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (type === "Approved") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (type === "Pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (type === "Cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ActivityCard({ item }) {
  return (
    <div className="rounded-2xl border border-[#e8efea] bg-[#fbfdfb] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-semibold ${getActivityBadgeClass(
            item.type
          )}`}
        >
          {item.type}
        </span>
        <p className="text-right text-[13px] font-medium text-[#6f8578]">{item.time}</p>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c9387]">
            Reference
          </p>
          <p className="mt-1 text-[15px] font-bold text-[#1b1f1d]">{item.reference}</p>
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c9387]">
            Details
          </p>
          <p className="mt-1 text-[14px] font-medium leading-6 text-[#33443c]">{item.details}</p>
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7c9387]">
            Amount
          </p>
          <p className="mt-1 text-[15px] font-bold text-[#163328]">
            {formatNepalCurrency(item.amount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[132px] rounded-[28px] border border-white/60 bg-white/80 shadow-sm"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-[340px] rounded-[28px] border border-white/60 bg-white/80 shadow-sm" />
        <div className="h-[340px] rounded-[28px] border border-white/60 bg-white/80 shadow-sm" />
      </div>
      <div className="h-[360px] rounded-[28px] border border-white/60 bg-white/80 shadow-sm" />
    </div>
  );
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
      const msg = err?.response?.data?.message || "Failed to load admin dashboard.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(
    () => [
      {
        label: "Total Tourists",
        value: Number(dashboard.stats.totalTourists || 0).toLocaleString("en-IN"),
        icon: FiUsers,
      },
      {
        label: "Total Agencies",
        value: Number(dashboard.stats.totalAgencies || 0).toLocaleString("en-IN"),
        icon: FiBarChart2,
      },
      {
        label: "Total Bookings",
        value: Number(dashboard.stats.totalBookings || 0).toLocaleString("en-IN"),
        icon: FiActivity,
      },
      {
        label: "Total Payments",
        value: formatNepalCurrency(dashboard.stats.totalPayments || 0),
        icon: FiTrendingUp,
      },
      {
        label: "Active Tours",
        value: Number(dashboard.stats.activeTours || 0).toLocaleString("en-IN"),
        icon: FiStar,
      },
    ],
    [dashboard.stats]
  );

  return (
    <AdminLayout active="dashboard">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-120px] top-[-70px] h-[280px] w-[280px] rounded-full bg-[#06733f]/10 blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-60px] h-[320px] w-[320px] rounded-full bg-[#0ea765]/10 blur-3xl" />
          <div className="absolute left-1/2 top-[18%] h-[180px] w-[180px] -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-[#0f2d21] via-[#174432] to-[#0b241b] px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,45,33,0.18)] sm:px-7 sm:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.22),_transparent_30%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  Tourism Nepal
                </div>
                <h1 className="mt-4 text-[28px] font-bold leading-tight sm:text-[36px]">
                  Admin Dashboard
                </h1>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="group inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-[15px] font-semibold text-white backdrop-blur transition duration-300 hover:bg-white hover:text-[#163328] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  size={18}
                  className={`${refreshing ? "animate-spin" : "transition duration-300 group-hover:rotate-180"}`}
                />
                {refreshing ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
              {error}
            </div>
          ) : null}

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map((item, index) => (
                  <SummaryCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    icon={item.icon}
                    delay={index * 60}
                  />
                ))}
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#183128]">Performance Lists</h2>
                    <p className="mt-1 text-sm text-[#708679]">
                      Quick insights into the best-performing tours and agencies.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <RankedList
                    title="Popular Tours"
                    rightLabel="Last 30 days"
                    items={dashboard.popularTours}
                    emptyText="No successful booking data available yet."
                    icon={FiTrendingUp}
                  />

                  <RankedList
                    title="Top Rated Agencies"
                    rightLabel="Average rating"
                    items={dashboard.topRatedAgencies}
                    showRatingIcon
                    emptyText="No review data available yet."
                    icon={FiStar}
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#183128]">Latest Activity</h2>
                    <p className="mt-1 text-sm text-[#708679]">
                      Recent booking and payment activity across the platform.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_10px_35px_rgba(16,24,40,0.08)] backdrop-blur-xl">
                  {dashboard.latestActivity.length === 0 ? (
                    <div className="p-5">
                      <div className="rounded-2xl border border-dashed border-[#d7e3da] bg-[#fbfdfb] px-4 py-8 text-sm text-gray-500">
                        No recent activity found.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 p-4 md:hidden">
                        {dashboard.latestActivity.map((item, index) => (
                          <ActivityCard key={`${item.reference}-${index}`} item={item} />
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="border-b border-[#e4ece6] bg-[#f8fbf8]">
                              <th className="px-5 py-4 text-left text-[13px] font-bold uppercase tracking-[0.12em] text-[#73917f]">
                                Status
                              </th>
                              <th className="px-5 py-4 text-left text-[13px] font-bold uppercase tracking-[0.12em] text-[#73917f]">
                                Reference
                              </th>
                              <th className="px-5 py-4 text-left text-[13px] font-bold uppercase tracking-[0.12em] text-[#73917f]">
                                Details
                              </th>
                              <th className="px-5 py-4 text-left text-[13px] font-bold uppercase tracking-[0.12em] text-[#73917f]">
                                Time
                              </th>
                              <th className="px-5 py-4 text-left text-[13px] font-bold uppercase tracking-[0.12em] text-[#73917f]">
                                Amount
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {dashboard.latestActivity.map((item, index) => (
                              <tr
                                key={`${item.reference}-${index}`}
                                className="border-b border-[#edf2ee] transition duration-200 hover:bg-[#fbfdfb] last:border-b-0"
                              >
                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-[12px] font-semibold ${getActivityBadgeClass(
                                      item.type
                                    )}`}
                                  >
                                    {item.type}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-[15px] font-bold text-[#1b1f1d]">
                                  {item.reference}
                                </td>
                                <td className="px-5 py-4 text-[15px] font-medium text-[#33443c]">
                                  {item.details}
                                </td>
                                <td className="px-5 py-4 text-[14px] font-medium text-[#5f7567]">
                                  {item.time}
                                </td>
                                <td className="px-5 py-4 text-[15px] font-bold text-[#163328]">
                                  {formatNepalCurrency(item.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}