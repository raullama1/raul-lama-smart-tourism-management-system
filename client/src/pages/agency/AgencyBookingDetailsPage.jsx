// client/src/pages/agency/AgencyBookingDetailsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiBell,
  FiCheckCircle,
  FiMessageSquare,
  FiXCircle,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiCreditCard,
  FiClock,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import {
  approveAgencyBooking,
  fetchAgencyBookingDetails,
  rejectAgencyBooking,
} from "../../api/agencyBookingsApi";
import {
  toPublicImageUrl,
  FALLBACK_TOUR_IMG,
} from "../../utils/publicImageUrl";

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[400]">
      <div
        className={[
          "pointer-events-auto relative w-[340px] rounded-[22px] border px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl",
          "transition-all duration-300 ease-out",
          open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          boxClass,
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-700/70 transition hover:bg-black/5 hover:text-gray-900"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="pr-8 text-sm font-semibold">{message}</div>
      </div>
    </div>
  );
}

function fmtYMDLong(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function splitDates(raw) {
  const v = String(raw || "");
  const [a, b] = v.split("|");
  return { start: a ? a.trim() : "", end: b ? b.trim() : "" };
}

function uiStatus(bookingStatus) {
  const s = String(bookingStatus || "").toLowerCase();
  if (s === "pending") return "Requested";
  if (s === "approved") return "Approved";
  if (s === "confirmed") return "In Progress";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return "—";
}

function StatusChip({ label, tone = "gray" }) {
  const styles =
    tone === "green"
      ? "border-emerald-200 bg-emerald-600 text-white"
      : tone === "orange"
        ? "border-amber-200 bg-amber-500 text-white"
        : tone === "red"
          ? "border-red-200 bg-red-500 text-white"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-black shadow-sm",
        styles,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function Step({ label, active = false, done = false }) {
  const cls = done
    ? "border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"
    : active
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-100 bg-white text-emerald-950/70";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={[
        "flex min-h-[68px] flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black",
        cls,
      ].join(" ")}
    >
      {done ? <FiCheckCircle /> : null}
      <span>{label}</span>
    </motion.div>
  );
}

function InfoRow({ icon, label, value, valueClassName = "" }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-100/80 bg-white/70 px-4 py-3">
      <div className="flex items-center gap-2 text-emerald-950/70">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <div
        className={`text-right text-sm font-extrabold text-slate-900 ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, className = "" }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 ${className}`}
    >
      <div>
        <h3 className="text-base font-black tracking-tight text-slate-900 md:text-lg">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

function AgencyBookingDetailsPageContent({ openNotifications }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await fetchAgencyBookingDetails(bookingId);
      setRow(res?.data || null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load booking details.");
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  const derived = useMemo(() => {
    const bookingStatus = String(row?.booking_status || "").trim().toLowerCase();
    const paymentStatus = String(row?.payment_status || "").toLowerCase();

    const canApprove = bookingStatus === "pending" && paymentStatus === "unpaid";
    const canReject = bookingStatus === "pending";

    const scheduleLabel = row?.selected_date_label?.trim();
    const fromAgencyDates = splitDates(row?.agency_available_dates);
    const schedule =
      scheduleLabel ||
      (fromAgencyDates.start && fromAgencyDates.end
        ? `${fmtYMDLong(fromAgencyDates.start)} - ${fmtYMDLong(fromAgencyDates.end)}`
        : "—");

    const img = toPublicImageUrl(row?.tour_image_url) || FALLBACK_TOUR_IMG;

    const statusLabel = uiStatus(bookingStatus);

    const paymentLabel = String(row?.payment_status || "Unpaid");
    const paymentTone =
      String(row?.payment_status || "").toLowerCase() === "paid"
        ? "green"
        : "gray";

    const topStatusTone =
      bookingStatus === "completed"
        ? "green"
        : bookingStatus === "confirmed"
          ? "orange"
          : bookingStatus === "approved"
            ? "green"
            : bookingStatus === "cancelled"
              ? "red"
              : "gray";

    const steps = {
      requested: bookingStatus !== "cancelled",
      approved:
        bookingStatus === "approved" ||
        bookingStatus === "confirmed" ||
        bookingStatus === "completed",
      payment: paymentStatus === "paid",
      inProgress: bookingStatus === "confirmed",
      completed: bookingStatus === "completed",
      cancelled: bookingStatus === "cancelled",
    };

    return {
      canApprove,
      canReject,
      schedule,
      img,
      statusLabel,
      paymentLabel,
      paymentTone,
      topStatusTone,
      bookingStatus,
      steps,
    };
  }, [row]);

  const onApprove = async () => {
    try {
      setBusy(true);
      await approveAgencyBooking(bookingId);
      showToast("success", "Booking approved.");
      await load();
    } catch (e) {
      showToast(
        "error",
        e?.response?.data?.message || "Failed to approve booking."
      );
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    try {
      setBusy(true);
      await rejectAgencyBooking(bookingId);
      showToast("success", "Booking rejected.");
      await load();
    } catch (e) {
      showToast(
        "error",
        e?.response?.data?.message || "Failed to reject booking."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}
    openNotifications?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_26%),radial-gradient(circle_at_left,rgba(59,130,246,0.08),transparent_24%)]" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Agency Panel
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Booking Details
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
              Review tourist booking information, payment state, schedule, and manage next actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenNotifications}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-slate-700 shadow-sm transition hover:bg-emerald-50"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiBell size={18} />
              {Number(unreadCount || 0) > 0 && (
                <span className="absolute -right-1 -top-1 grid min-h-[22px] min-w-[22px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/agency/bookings")}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
            >
              <FiArrowLeft />
              Back to Bookings
            </button>
          </div>
        </div>

        {loading ? (
          <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="text-sm font-semibold text-slate-500">Loading booking details...</p>
          </div>
        ) : err ? (
          <div className="relative mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {err}
          </div>
        ) : !row ? (
          <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Booking not found.</p>
          </div>
        ) : (
          <>
            <div className="relative mt-6 overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="relative min-h-[280px] overflow-hidden">
                  <img
                    src={derived.img}
                    alt={row.tour_title || "Tour"}
                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_TOUR_IMG;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip
                        label={`Payment: ${derived.paymentLabel}`}
                        tone={derived.paymentTone}
                      />
                      <StatusChip
                        label={`Status: ${derived.statusLabel}`}
                        tone={derived.topStatusTone}
                      />
                    </div>

                    <h2 className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-white md:text-3xl">
                      {row.tour_title || "—"}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-white/85">
                      Ref: {row.ref_code || "—"} • Created {fmtYMDLong(row.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-5 p-5 md:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                          <FiUsers size={20} />
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                            Tourist
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            {row.tourist_name || "—"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {row.tourist_email || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                          <FiCreditCard size={20} />
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                            Total Amount
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            NPR {Number(row.total_price || 0).toLocaleString("en-NP")}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {Number(row.travelers || 1)}{" "}
                            {Number(row.travelers || 1) === 1 ? "Traveler" : "Travelers"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                          <FiCalendar size={20} />
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                            Schedule
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            {derived.schedule}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                          <FiClock size={20} />
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                            Booking Date
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            {fmtYMDLong(row.booking_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={onApprove}
                      disabled={!derived.canApprove || busy}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiCheckCircle />
                      Approve Booking
                    </button>

                    <button
                      type="button"
                      onClick={onReject}
                      disabled={!derived.canReject || busy}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiXCircle />
                      Reject Booking
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const touristId = Number(row?.tourist_id);
                        if (!touristId) {
                          showToast("error", "Tourist id not found for this booking.");
                          return;
                        }
                        navigate(`/agency/chat?touristId=${touristId}`);
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-900"
                    >
                      <FiMessageSquare />
                      Chat with Tourist
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                title="Booking Overview"
                subtitle="Main booking information and current states."
              >
                <div className="grid grid-cols-1 gap-3">
                  <InfoRow
                    icon={<FiMapPin size={18} />}
                    label="Tour Name"
                    value={row.tour_title || "—"}
                  />
                  <InfoRow
                    icon={<FiUsers size={18} />}
                    label="Tourist Information"
                    value={`${row.tourist_name || "—"} • ${row.tourist_email || "—"}`}
                    valueClassName="max-w-[65%] break-words"
                  />
                  <InfoRow
                    icon={<FiCalendar size={18} />}
                    label="Booking Date"
                    value={fmtYMDLong(row.booking_date)}
                  />
                  <InfoRow
                    icon={<FiUsers size={18} />}
                    label="Travelers Count"
                    value={`${Number(row.travelers || 1)} ${
                      Number(row.travelers || 1) === 1 ? "Traveler" : "Travelers"
                    }`}
                  />
                  <InfoRow
                    icon={<FiCheckCircle size={18} />}
                    label="Current Booking Status"
                    value={derived.statusLabel}
                  />
                  <InfoRow
                    icon={<FiCreditCard size={18} />}
                    label="Payment Status"
                    value={`${derived.paymentLabel}${
                      Number(row.total_price || 0) > 0
                        ? ` • Amount: NPR ${Number(row.total_price || 0).toLocaleString("en-NP")}`
                        : ""
                    }`}
                    valueClassName="max-w-[65%] break-words"
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Agency Price & Schedule"
                subtitle="Price breakdown and selected tour dates."
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                      Agency Price (per person)
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      NPR{" "}
                      {Number(row.agency_price_per_person || 0).toLocaleString("en-NP")}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                      Total ({Number(row.travelers || 1)}{" "}
                      {Number(row.travelers || 1) === 1 ? "traveler" : "travelers"})
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      NPR {Number(row.total_price || 0).toLocaleString("en-NP")}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                      Schedule
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-slate-900">
                      {derived.schedule}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900/60">
                      Itinerary Highlights
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                      {row.tour_description
                        ? String(row.tour_description).trim()
                        : "—"}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {toast.open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <Toast
              open={toast.open}
              type={toast.type}
              message={toast.message}
              onClose={() => setToast((p) => ({ ...p, open: false }))}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default function AgencyBookingDetailsPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyBookingDetailsPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}