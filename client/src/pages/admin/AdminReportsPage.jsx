// client/src/pages/admin/AdminReportsPage.jsx
import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getAdminReports } from "../../api/adminReportsApi";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiLock,
  FiStar,
  FiRefreshCw,
  FiBarChart2,
  FiUsers,
  FiUserCheck,
  FiDollarSign,
  FiChevronRight,
} from "react-icons/fi";
import { motion } from "framer-motion";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function StatCard({ title, value, icon, tint }) {
  return (
    <motion.div
      whileHover={{ y: -5, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_42%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-3 text-[30px] font-black tracking-tight text-slate-900 md:text-[34px]">
            {value}
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function SectionCard({ title, subtitle, accent, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-5 h-[360px] overflow-y-auto pr-1">{children}</div>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}

function NumberBadge({ index, tint = "bg-emerald-100 text-emerald-800" }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm ${tint}`}
    >
      {index}
    </div>
  );
}

function ListRow({ left, right, tone = "bg-slate-50" }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`flex items-center justify-between gap-3 rounded-[22px] border border-slate-200/70 px-4 py-3.5 ${tone}`}
    >
      {left}
      {right}
    </motion.div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState({
    summary: {
      bookings: 0,
      tourists: 0,
      agencies: 0,
      payments: 0,
    },
    topTours: [],
    blocked: [],
    ratings: [],
    paymentsOverTime: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const res = await getAdminReports();

      setData({
        summary: {
          bookings: Number(res?.summary?.bookings || 0),
          tourists: Number(res?.summary?.tourists || 0),
          agencies: Number(res?.summary?.agencies || 0),
          payments: Number(res?.summary?.payments || 0),
        },
        topTours: Array.isArray(res?.topTours) ? res.topTours : [],
        blocked: Array.isArray(res?.blocked) ? res.blocked : [],
        ratings: Array.isArray(res?.ratings) ? res.ratings : [],
        paymentsOverTime: Array.isArray(res?.paymentsOverTime)
          ? res.paymentsOverTime
          : [],
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load reports.");
      setData({
        summary: {
          bookings: 0,
          tourists: 0,
          agencies: 0,
          payments: 0,
        },
        topTours: [],
        blocked: [],
        ratings: [],
        paymentsOverTime: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const summary = useMemo(() => data.summary || {}, [data]);

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f2f7f4_46%,#edf7f0_100%)]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="reports" />

        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 xl:px-7">
          <div className="mx-auto max-w-[1700px] pb-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(14,165,233,0.08),transparent_24%)]" />

              <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Tourism Nepal
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Reports & Analytics
                  </h1>
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => loadReports(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRefreshCw
                    size={18}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </motion.button>
              </div>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </motion.div>
              ) : null}

              <div
                className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                style={{ perspective: "1200px" }}
              >
                <StatCard
                  title="Total Bookings"
                  value={formatNumber(summary.bookings)}
                  icon={<FiBarChart2 size={22} />}
                  tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                />
                <StatCard
                  title="Total Tourists"
                  value={formatNumber(summary.tourists)}
                  icon={<FiUsers size={22} />}
                  tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                />
                <StatCard
                  title="Active Agencies"
                  value={formatNumber(summary.agencies)}
                  icon={<FiUserCheck size={22} />}
                  tint="border-violet-100 bg-gradient-to-br from-violet-50 to-white"
                />
                <StatCard
                  title="Payment Volume"
                  value={formatCurrency(summary.payments)}
                  icon={<FiDollarSign size={22} />}
                  tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                />
              </div>

              {loading ? (
                <div className="relative mt-6 overflow-hidden rounded-[30px] border border-white/70 bg-white/80 px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                  <p className="text-sm font-semibold text-slate-500">
                    Loading reports...
                  </p>
                </div>
              ) : (
                <div className="relative mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <SectionCard
                    title="Most Booked Tours"
                    subtitle="Top performing tours based on recent booking volume."
                    accent="bg-gradient-to-r from-emerald-500 to-teal-400"
                  >
                    {data.topTours.length === 0 ? (
                      <EmptyState text="No tour booking data found." />
                    ) : (
                      <div className="space-y-3">
                        {data.topTours.map((t, index) => (
                          <ListRow
                            key={`${t.title}-${index}`}
                            tone="bg-gradient-to-r from-emerald-50/80 to-white"
                            left={
                              <div className="flex min-w-0 items-center gap-3">
                                <NumberBadge
                                  index={index + 1}
                                  tint="bg-emerald-100 text-emerald-800"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {t.title}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-slate-500">
                                    Popular tour entry
                                  </p>
                                </div>
                              </div>
                            }
                            right={
                              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700">
                                <FiChevronRight size={15} />
                                {formatNumber(t.bookings)}
                              </div>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Blocked Users & Agencies"
                    subtitle="Accounts currently restricted from platform access."
                    accent="bg-gradient-to-r from-rose-500 to-red-400"
                  >
                    {data.blocked.length === 0 ? (
                      <EmptyState text="No blocked users or agencies found." />
                    ) : (
                      <div className="space-y-3">
                        {data.blocked.map((b, index) => (
                          <ListRow
                            key={`${b.type}-${b.name}-${index}`}
                            tone="bg-gradient-to-r from-rose-50/80 to-white"
                            left={
                              <div className="flex min-w-0 items-center gap-3">
                                <NumberBadge
                                  index={index + 1}
                                  tint="bg-rose-100 text-rose-800"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {b.name}
                                  </p>
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    {b.type}
                                  </p>
                                </div>
                              </div>
                            }
                            right={
                              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                                <FiLock size={14} />
                                Blocked
                              </span>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Highest Rated Agencies"
                    subtitle="Agencies with the strongest public review performance."
                    accent="bg-gradient-to-r from-amber-500 to-yellow-400"
                  >
                    {data.ratings.length === 0 ? (
                      <EmptyState text="No rating data found." />
                    ) : (
                      <div className="space-y-3">
                        {data.ratings.map((r, index) => (
                          <ListRow
                            key={`${r.name}-${index}`}
                            tone="bg-gradient-to-r from-amber-50/80 to-white"
                            left={
                              <div className="flex min-w-0 items-center gap-3">
                                <NumberBadge
                                  index={index + 1}
                                  tint="bg-amber-100 text-amber-800"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {r.name}
                                  </p>
                                  <p className="text-sm font-medium text-slate-500">
                                    {formatNumber(r.total_reviews)} reviews
                                  </p>
                                </div>
                              </div>
                            }
                            right={
                              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                                <FiStar size={14} />
                                {r.rating}
                              </span>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Total Payments Over Time"
                    subtitle="Monthly payment volume with growth direction indicators."
                    accent="bg-gradient-to-r from-sky-500 to-cyan-400"
                  >
                    {data.paymentsOverTime.length === 0 ? (
                      <EmptyState text="No payment history found." />
                    ) : (
                      <div className="space-y-3">
                        {data.paymentsOverTime.map((p, index) => {
                          const positive = Number(p.growth) >= 0;

                          return (
                            <ListRow
                              key={`${p.month}-${index}`}
                              tone="bg-gradient-to-r from-sky-50/80 to-white"
                              left={
                                <div className="flex min-w-0 items-center gap-3">
                                  <NumberBadge
                                    index={index + 1}
                                    tint="bg-sky-100 text-sky-800"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">
                                      {p.month}
                                    </p>
                                    <p className="text-sm font-medium text-slate-500">
                                      {formatCurrency(p.amount)}
                                    </p>
                                  </div>
                                </div>
                              }
                              right={
                                <span
                                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                                    positive
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  {positive ? (
                                    <FiTrendingUp size={14} />
                                  ) : (
                                    <FiTrendingDown size={14} />
                                  )}
                                  {Number(p.growth) > 0
                                    ? `+${p.growth}%`
                                    : `${p.growth}%`}
                                </span>
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}