// client/src/pages/agency/AgencyBookingsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiEye,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiBell,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiTrendingUp,
  FiClock,
  FiSlash,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import {
  approveAgencyBooking,
  fetchAgencyBookings,
  rejectAgencyBooking,
} from "../../api/agencyBookingsApi";

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50/95 text-emerald-900"
      : "border-red-200 bg-red-50/95 text-red-900";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          className="fixed right-4 top-4 z-[400] sm:right-5 sm:top-5"
        >
          <div
            className={[
              "relative w-[min(92vw,360px)] rounded-[24px] border px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur-xl",
              boxClass,
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-700/70 transition hover:bg-black/5 hover:text-gray-900"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="pr-8 text-sm font-bold leading-6">{message}</div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StatusPill({ v }) {
  const s = String(v || "").toLowerCase();

  const map = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    approved: "border-sky-200 bg-sky-50 text-sky-800",
    confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    completed: "border-slate-200 bg-slate-100 text-slate-800",
    rejected: "border-red-200 bg-red-50 text-red-800",
    cancelled: "border-rose-200 bg-rose-50 text-rose-800",
    canceled: "border-rose-200 bg-rose-50 text-rose-800",
  };

  const label = s ? s[0].toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold",
        map[s] || "border-slate-200 bg-slate-100 text-slate-800",
      ].join(" ")}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}

function PaymentPill({ v }) {
  const s = String(v || "").toLowerCase();

  const map = {
    unpaid: "border-amber-200 bg-amber-50 text-amber-800",
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  const pretty = s ? s[0].toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-extrabold",
        map[s] || "border-slate-200 bg-slate-100 text-slate-800",
      ].join(" ")}
    >
      {pretty}
    </span>
  );
}

function formatYMD(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function StatCard({ icon, label, value, tone = "emerald" }) {
  const toneMap = {
    emerald: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    sky: "border-sky-100 bg-gradient-to-br from-sky-50 to-white",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
    violet: "border-violet-100 bg-gradient-to-br from-violet-50 to-white",
    rose: "border-rose-100 bg-gradient-to-br from-rose-50 to-white",
  };

  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${toneMap[tone]}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_45%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {value}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function ActionIconButton({
  onClick,
  className,
  title,
  children,
  disabled = false,
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={title}
    >
      {children}
    </motion.button>
  );
}

function MobileBookingCard({
  booking,
  busyId,
  canApproveReject,
  navigate,
  onApprove,
  onReject,
  showToast,
}) {
  const bookingId = booking.booking_id ?? booking.id;
  const tourTitle = booking.tour_title ?? "—";
  const tourLocation = booking.tour_location ?? "";
  const touristName = booking.tourist_name ?? "—";
  const touristEmail = booking.tourist_email ?? "";
  const bookingDate = formatYMD(booking.booking_date ?? booking.created_at);
  const travelers = Number(booking.travelers);
  const statusVal = booking.booking_status ?? booking.status;
  const paymentVal = booking.payment_status ?? "Unpaid";
  const approveReject = canApproveReject(booking);
  const isBusy = busyId === bookingId;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[26px] border border-emerald-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-slate-900">{tourTitle}</p>
          {tourLocation ? (
            <p className="mt-1 truncate text-sm text-slate-500">{tourLocation}</p>
          ) : null}
        </div>
        <StatusPill v={statusVal} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Tourist
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">{touristName}</p>
          {touristEmail ? (
            <p className="mt-1 text-xs text-slate-500">{touristEmail}</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Booking Date
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">{bookingDate}</p>
          {booking.selected_date_label ? (
            <p className="mt-1 text-xs text-slate-500">{booking.selected_date_label}</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Travelers
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {Number.isFinite(travelers) && travelers > 0 ? travelers : 1}{" "}
            {Number.isFinite(travelers) && travelers === 1 ? "Traveler" : "Travelers"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Payment
          </p>
          <div className="mt-2">
            <PaymentPill v={paymentVal} />
          </div>
        </div>
      </div>

      {booking.ref_code ? (
        <div className="mt-4 inline-flex items-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-900">
          Ref: {booking.ref_code}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(`/agency/bookings/${bookingId}`)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
        >
          <FiEye />
          View
        </button>

        {approveReject ? (
          <>
            <button
              type="button"
              onClick={() => onApprove(bookingId)}
              disabled={isBusy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <FiCheck />
              Approve
            </button>

            <button
              type="button"
              onClick={() => onReject(bookingId)}
              disabled={isBusy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              <FiX />
              Reject
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => showToast("success", "Chat wiring can be connected next.")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
        >
          <FiMessageSquare />
          Chat
        </button>
      </div>
    </motion.div>
  );
}

function AgencyBookingsPageContent({ openNotifications }) {
  const navigate = useNavigate();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [sort, setSort] = useState("latest");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const [busyId, setBusyId] = useState(null);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const params = useMemo(() => {
    return {
      status,
      payment,
      sort,
      q: debouncedQ,
    };
  }, [status, payment, sort, debouncedQ]);

  const load = async (first = false) => {
    try {
      setErr("");
      if (first) setLoading(true);
      else setFetching(true);

      const res = await fetchAgencyBookings(params);
      setRows(res?.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load bookings.");
      setRows([]);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    load(false);
  }, [params.status, params.payment, params.sort, params.q]);

  const canApproveReject = (b) => {
    const s = String(b?.booking_status || b?.status || "").toLowerCase();
    const p = String(b?.payment_status || "").toLowerCase();
    return s === "pending" && (p === "unpaid" || !p);
  };

  const onApprove = async (bookingId) => {
    try {
      setBusyId(bookingId);
      await approveAgencyBooking(bookingId);
      showToast("success", "Booking approved.");
      await load(false);
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to approve booking.");
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (bookingId) => {
    try {
      setBusyId(bookingId);
      await rejectAgencyBooking(bookingId);
      showToast("success", "Booking rejected.");
      await load(false);
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to reject booking.");
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  const totalBookings = rows.length;
  const pendingCount = rows.filter((b) =>
    String(b?.booking_status || b?.status || "").toLowerCase() === "pending"
  ).length;
  const paidCount = rows.filter((b) =>
    ["paid", "completed"].includes(String(b?.payment_status || "").toLowerCase())
  ).length;
  const canceledCount = rows.filter((b) =>
    ["cancelled", "canceled", "rejected"].includes(
      String(b?.booking_status || b?.status || "").toLowerCase()
    )
  ).length;
  const latestCount = rows.filter((b) => {
    const raw = b?.booking_date ?? b?.created_at;
    if (!raw) return false;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;

  return (
    <>
      <div className="rounded-[32px] border border-white/60 bg-white/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-100/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-5 shadow-sm md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.65),transparent_32%)]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Agency Panel
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Bookings
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                Manage booking requests, review payment status, and handle approvals with a cleaner workflow.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => load(false)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                disabled={fetching}
                title="Refresh"
              >
                <span className={fetching ? "animate-spin" : ""}>
                  <FiRefreshCw />
                </span>
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleOpenNotifications}
                className="relative grid h-12 w-12 place-items-center rounded-2xl border border-emerald-100 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                title="Notifications"
                aria-label="Notifications"
              >
                <FiBell />
                {Number(unreadCount || 0) > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          <div
            className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
            style={{ perspective: "1200px" }}
          >
            <StatCard
              icon={<FiTrendingUp size={21} />}
              label="Total"
              value={totalBookings}
              tone="emerald"
            />
            <StatCard
              icon={<FiClock size={21} />}
              label="Pending"
              value={pendingCount}
              tone="amber"
            />
            <StatCard
              icon={<FiCreditCard size={21} />}
              label="Paid"
              value={paidCount}
              tone="sky"
            />
            <StatCard
              icon={<FiSlash size={21} />}
              label="Canceled"
              value={canceledCount}
              tone="rose"
            />
            <StatCard
              icon={<FiCalendar size={21} />}
              label="This Week"
              value={latestCount}
              tone="violet"
            />
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:flex-[1.3]">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by tour name, tourist name, or ref code..."
                className="h-12 w-full rounded-2xl border border-emerald-100 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:flex-nowrap">
              <div className="relative w-full sm:w-[180px]">
                <FiFilter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-emerald-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="relative w-full sm:w-[170px]">
                <FiCreditCard className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-emerald-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="all">All Payments</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="relative w-full sm:w-[150px]">
                <FiCalendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-emerald-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="mt-3 text-xs font-bold text-slate-500">Updating...</div>
          ) : null}
        </div>

        {err ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
          >
            {err}
          </motion.div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-[1080px] w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-slate-50">
                <tr className="text-left text-[11px] font-black uppercase tracking-[0.14em] text-emerald-900/70">
                  <th className="px-5 py-4">Tour Name</th>
                  <th className="px-5 py-4">Tourist Name</th>
                  <th className="px-5 py-4">Booking Date</th>
                  <th className="px-5 py-4">Travelers</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  rows.map((b, index) => {
                    const bookingId = b.booking_id ?? b.id;
                    const tourTitle = b.tour_title ?? "—";
                    const tourLocation = b.tour_location ?? "";
                    const touristName = b.tourist_name ?? "—";
                    const touristEmail = b.tourist_email ?? "";
                    const bookingDate = formatYMD(b.booking_date ?? b.created_at);
                    const travelers = Number(b.travelers);
                    const statusVal = b.booking_status ?? b.status;
                    const paymentVal = b.payment_status ?? "Unpaid";
                    const approveReject = canApproveReject(b);
                    const isBusy = busyId === bookingId;

                    return (
                      <motion.tr
                        key={bookingId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.025 }}
                        className="hover:bg-emerald-50/30"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-black leading-snug text-slate-900">
                            {tourTitle}
                          </div>
                          {tourLocation ? (
                            <div className="mt-1 text-xs text-slate-500">{tourLocation}</div>
                          ) : null}
                          {b.ref_code ? (
                            <div className="mt-2 inline-flex items-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-900/80">
                              Ref: {b.ref_code}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-bold text-slate-900">{touristName}</div>
                          {touristEmail ? (
                            <div className="mt-1 text-xs text-slate-500">{touristEmail}</div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-bold text-slate-900">{bookingDate}</div>
                          {b.selected_date_label ? (
                            <div className="mt-1 text-xs text-slate-500">{b.selected_date_label}</div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className="inline-flex items-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900">
                            <FiUsers className="mr-2" />
                            {Number.isFinite(travelers) && travelers > 0 ? travelers : 1}{" "}
                            {Number.isFinite(travelers) && travelers === 1 ? "Traveler" : "Travelers"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <StatusPill v={statusVal} />
                        </td>

                        <td className="px-5 py-4 align-top">
                          <PaymentPill v={paymentVal} />
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <ActionIconButton
                              onClick={() => navigate(`/agency/bookings/${bookingId}`)}
                              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
                              title="View details"
                            >
                              <FiEye />
                            </ActionIconButton>

                            {approveReject ? (
                              <>
                                <ActionIconButton
                                  onClick={() => onApprove(bookingId)}
                                  disabled={isBusy}
                                  className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                  title="Approve booking"
                                >
                                  <FiCheck />
                                </ActionIconButton>

                                <ActionIconButton
                                  onClick={() => onReject(bookingId)}
                                  disabled={isBusy}
                                  className="grid h-11 w-11 place-items-center rounded-2xl bg-red-600 text-white transition hover:bg-red-700 disabled:opacity-60"
                                  title="Reject booking"
                                >
                                  <FiX />
                                </ActionIconButton>
                              </>
                            ) : null}

                            <ActionIconButton
                              onClick={() =>
                                showToast("success", "Chat wiring can be connected next.")
                              }
                              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
                              title="Chat"
                            >
                              <FiMessageSquare />
                            </ActionIconButton>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 xl:hidden">
            {loading ? (
              <div className="rounded-[24px] border border-dashed border-emerald-100 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Loading...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-emerald-100 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-500">
                No bookings found.
              </div>
            ) : (
              rows.map((booking) => (
                <MobileBookingCard
                  key={booking.booking_id ?? booking.id}
                  booking={booking}
                  busyId={busyId}
                  canApproveReject={canApproveReject}
                  navigate={navigate}
                  onApprove={onApprove}
                  onReject={onReject}
                  showToast={showToast}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </>
  );
}

export default function AgencyBookingsPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyBookingsPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}