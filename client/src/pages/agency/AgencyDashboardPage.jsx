// c`lient/src/pages/agency/AgencyDashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiPlus,
  FiArrowUpRight,
  FiCalendar,
  FiCreditCard,
  FiClock,
  FiCompass,
  FiTrendingUp,
  FiRefreshCw,
  FiStar,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import { getAgencyDashboard } from "../../api/agencyDashboardApi";

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "pending"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "docs"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : tone === "confirmed"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm ${cls}`}
    >
      {children}
    </span>
  );
}

function KpiCard({ icon, label, value, hint, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`group relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_45%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </div>
          <div className="mt-4 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            {value}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">{hint}</div>
        </div>

        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/60 bg-white/85 text-slate-700 shadow-sm">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function Stars({ value }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex gap-0.5 text-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? "text-amber-500" : "text-slate-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-sm font-medium text-slate-500">
                {subtitle}
              </div>
            ) : null}
          </div>
          {action}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-4 text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <div className="text-sm font-semibold text-slate-500">Loading...</div>
      </div>
    </div>
  );
}

function AgencyDashboardPageContent({ openNotifications }) {
  const navigate = useNavigate();
  const { agency } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    stats: { activeTours: 0, bookings: 0, pendingRequests: 0, earningsNpr: 0 },
    recentBookings: [],
    recentReviews: [],
  });

  const title = useMemo(() => {
    const n = agency?.name ? String(agency.name) : "Agency";
    return `Dashboard — ${n}`;
  }, [agency]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAgencyDashboard();
      setData(res);
    } catch (err) {
      console.error("getAgencyDashboard error", err);
      setError(err?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fmtNpr = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("en-US");
  };

  const statusTone = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "pending";
    if (s.includes("await")) return "docs";
    if (s === "confirmed" || s === "completed") return "confirmed";
    return "neutral";
  };

  const handleNewTour = () => {
    navigate("/agency/tours/new");
  };

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  return (
    <div className="min-h-full rounded-[32px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              Agency Workspace
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h1>

          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={fetchData}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
            >
              <FiRefreshCw size={16} />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleOpenNotifications}
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiBell size={18} />
              {Number(unreadCount || 0) > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-lg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleNewTour}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 px-4 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-800 hover:to-emerald-600"
            >
              <FiPlus size={17} />
              New Tour
            </motion.button>
          </div>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </motion.div>
        ) : null}

        <div
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4"
          style={{ perspective: "1200px" }}
        >
          <KpiCard
            icon={<FiCompass size={22} />}
            label="Active Tours"
            value={data.stats.activeTours}
            hint="Currently live packages"
            tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
          />
          <KpiCard
            icon={<FiCalendar size={22} />}
            label="Bookings"
            value={data.stats.bookings}
            hint="Total booking records"
            tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
          />
          <KpiCard
            icon={<FiClock size={22} />}
            label="Pending Requests"
            value={data.stats.pendingRequests}
            hint="Needs your action"
            tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
          />
          <KpiCard
            icon={<FiTrendingUp size={22} />}
            label="Earnings"
            value={`NPR ${fmtNpr(data.stats.earningsNpr)}`}
            hint="Current total revenue"
            tint="border-violet-100 bg-gradient-to-br from-violet-50 to-white"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 2xl:grid-cols-[1.08fr_0.92fr]">
          <Panel
            title="Recent Bookings"
            subtitle="Latest booking activity from your tours"
            action={
              <button
                type="button"
                onClick={() => navigate("/agency/bookings")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View all
                <FiArrowUpRight size={14} />
              </button>
            }
          >
            {loading ? (
              <LoadingState />
            ) : data.recentBookings.length === 0 ? (
              <EmptyState text="No bookings yet." />
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-3 shadow-inner">
                <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                  {data.recentBookings.map((b, index) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.03 }}
                      whileHover={{ y: -2 }}
                      className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-slate-900 md:text-[15px]">
                              {b.tour_title}
                            </div>
                            <Pill tone={statusTone(b.booking_status)}>
                              {b.booking_status}
                            </Pill>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <FiCalendar size={13} />
                              {b.booking_date_label}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>{b.user_name}</span>
                            <span className="text-slate-300">•</span>
                            <span>
                              {b.travelers} {b.travelers === 1 ? "Guest" : "Guests"}
                            </span>
                          </div>

                          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            <FiCreditCard size={13} />
                            {b.payment_label}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Recent Reviews"
            subtitle="What travelers are saying about your tours"
            action={
              <button
                type="button"
                onClick={() => navigate("/agency/reviews")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View all
                <FiArrowUpRight size={14} />
              </button>
            }
          >
            {loading ? (
              <LoadingState />
            ) : data.recentReviews.length === 0 ? (
              <EmptyState text="No reviews yet." />
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-3 shadow-inner">
                <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                  {data.recentReviews.map((r, index) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.03 }}
                      whileHover={{ y: -2 }}
                      className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                          <FiStar size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-bold text-slate-900">
                              {r.user_name}
                            </div>
                            <Stars value={r.rating} />
                          </div>

                          <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                            “{r.comment}”
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </motion.div>
    </div>
  );
}

export default function AgencyDashboardPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyDashboardPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}