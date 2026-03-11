// client/src/pages/admin/AdminTouristDetailsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiSearch,
  FiSliders,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiUser,
  FiStar,
  FiHeart,
  FiShoppingBag,
  FiTrash2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  deleteAdminTouristReview,
  getAdminTouristById,
  updateAdminTouristStatus,
} from "../../api/adminTouristsApi";

function StatusBadge({ blocked }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-xl ${
        blocked
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          blocked ? "bg-red-500" : "bg-emerald-500"
        }`}
      />
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClassName,
  onClose,
  onConfirm,
  submitting,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/40 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.22)]"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-[15px] leading-7 text-slate-600">{message}</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={submitting}
                  className={confirmClassName}
                >
                  {submitting ? "Please wait..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-CA");
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function matchesSearch(values, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(q));
}

function getBookingStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("confirmed") || s.includes("completed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (s.includes("pending") || s.includes("approved")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (s.includes("cancel")) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function StatCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`group relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_45%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="rounded-[24px] border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-[0_10px_30px_rgba(16,24,40,0.06)]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 break-words text-[15px] font-semibold text-slate-900 md:text-base">
            {value || "-"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full xl:flex-[1.32]">
      <FiSearch
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function FilterSelect({ value, onChange, children, width = "md:w-[190px]" }) {
  return (
    <div className={`relative w-full xl:flex-none ${width}`}>
      <FiSliders
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      >
        {children}
      </select>
    </div>
  );
}

export default function AdminTouristDetailsPage() {
  const navigate = useNavigate();
  const { touristId } = useParams();

  const [tourist, setTourist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [bookingFilters, setBookingFilters] = useState({
    q: "",
    sort: "newest",
    status: "all",
  });

  const [reviewFilters, setReviewFilters] = useState({
    q: "",
    sort: "newest",
    status: "all",
  });

  const loadTourist = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      const data = await getAdminTouristById(touristId);
      setTourist(data?.tourist || null);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to load tourist details.";
      setPageError(msg);
      setTourist(null);
    } finally {
      setLoading(false);
    }
  }, [touristId]);

  useEffect(() => {
    loadTourist();
  }, [loadTourist]);

  const handleToggleStatus = async () => {
    if (!tourist) return;

    try {
      setStatusSubmitting(true);
      await updateAdminTouristStatus(tourist.id, !tourist.is_blocked);
      setStatusModalOpen(false);
      await loadTourist();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to update tourist status.";
      setPageError(msg);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!tourist || !reviewToDelete) return;

    try {
      setDeleteSubmitting(true);
      await deleteAdminTouristReview(tourist.id, reviewToDelete.id);
      setReviewToDelete(null);
      await loadTourist();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete review.";
      setPageError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const bookings = Array.isArray(tourist?.bookings) ? tourist.bookings : [];
  const reviews = Array.isArray(tourist?.reviews) ? tourist.reviews : [];

  const bookingStatusOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        bookings
          .map((item) => String(item.booking_status || "").trim())
          .filter(Boolean)
      )
    );
    return ["all", ...unique];
  }, [bookings]);

  const reviewStatusOptions = useMemo(
    () => ["all", "5", "4", "3", "2", "1"],
    []
  );

  const filteredBookings = useMemo(() => {
    const list = bookings.filter((booking) => {
      const matchesQ = matchesSearch(
        [
          booking.reference,
          booking.tour_title,
          booking.booking_date,
          booking.booking_status,
          booking.total_price,
        ],
        bookingFilters.q
      );

      const matchesStatus =
        bookingFilters.status === "all"
          ? true
          : String(booking.booking_status || "").toLowerCase() ===
            String(bookingFilters.status || "").toLowerCase();

      return matchesQ && matchesStatus;
    });

    list.sort((a, b) => {
      const aTime = new Date(a.booking_date).getTime() || 0;
      const bTime = new Date(b.booking_date).getTime() || 0;
      if (bookingFilters.sort === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return list;
  }, [bookings, bookingFilters]);

  const filteredReviews = useMemo(() => {
    const list = reviews.filter((review) => {
      const matchesQ = matchesSearch(
        [review.tour_title, review.rating, review.created_at, review.comment],
        reviewFilters.q
      );

      const matchesStatus =
        reviewFilters.status === "all"
          ? true
          : String(review.rating || "") === String(reviewFilters.status || "");

      return matchesQ && matchesStatus;
    });

    list.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime() || 0;
      const bTime = new Date(b.created_at).getTime() || 0;
      if (reviewFilters.sort === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return list;
  }, [reviews, reviewFilters]);

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f2f7f4_46%,#edf7f0_100%)]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="tourists" />

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
                    Admin Panel
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Tourist Profile
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                    View account details, booking activity, reviews, and manage tourist access.
                  </p>
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate("/admin/tourists")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
                >
                  <FiArrowLeft size={18} />
                  Back to Manage Tourists
                </motion.button>
              </div>

              {pageError ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {pageError}
                </motion.div>
              ) : null}

              {loading ? (
                <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                  <p className="text-sm font-semibold text-slate-500">
                    Loading tourist details...
                  </p>
                </div>
              ) : !tourist ? (
                <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">
                    Tourist not found.
                  </p>
                </div>
              ) : (
                <div className="relative mt-6 space-y-5">
                  <div
                    className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]"
                    style={{ perspective: "1200px" }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.04 }}
                      whileHover={{ rotateX: 1.2, rotateY: -1.2, y: -3 }}
                      className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_24%)]" />
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Account Overview
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Main profile information and status.
                          </p>
                        </div>
                        <StatusBadge blocked={tourist.is_blocked} />
                      </div>

                      <div className="relative mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                        <InfoCard
                          icon={<FiUser size={20} />}
                          label="Tourist Name"
                          value={tourist.name}
                        />
                        <InfoCard
                          icon={<FiMail size={20} />}
                          label="Email"
                          value={tourist.email}
                        />
                        <InfoCard
                          icon={<FiPhone size={20} />}
                          label="Phone"
                          value={tourist.phone}
                        />
                        <InfoCard
                          icon={<FiCalendar size={20} />}
                          label="Signup Date"
                          value={formatDateOnly(tourist.created_at)}
                        />
                        <InfoCard
                          icon={<FiShield size={20} />}
                          label="Account Status"
                          value={tourist.is_blocked ? "Blocked" : "Active"}
                        />
                      </div>

                      <div className="relative mt-5">
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.985 }}
                          type="button"
                          onClick={() => setStatusModalOpen(true)}
                          className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition ${
                            tourist.is_blocked
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                              : "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
                          }`}
                        >
                          {tourist.is_blocked ? "Unblock Tourist" : "Block Tourist"}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.08 }}
                      whileHover={{ rotateX: 1, rotateY: 1, y: -3 }}
                      className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%)]" />
                      <div className="relative">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                          Activity Summary
                        </h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Quick view of engagement and actions.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                          <StatCard
                            icon={<FiShoppingBag size={22} />}
                            label="Total Bookings"
                            value={tourist.total_bookings || 0}
                            tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                          />
                          <StatCard
                            icon={<FiStar size={22} />}
                            label="Total Reviews"
                            value={tourist.total_reviews || 0}
                            tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                          />
                          <StatCard
                            icon={<FiHeart size={22} />}
                            label="Wishlist Items"
                            value={tourist.total_wishlists || 0}
                            tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Booking History
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Search and filter booking activity.
                          </p>
                        </div>
                        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          {filteredBookings.length} Result{filteredBookings.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
                        <FilterInput
                          value={bookingFilters.q}
                          onChange={(e) =>
                            setBookingFilters((prev) => ({
                              ...prev,
                              q: e.target.value,
                            }))
                          }
                          placeholder="Search booking, tour or status"
                        />

                        <FilterSelect
                          value={bookingFilters.sort}
                          onChange={(e) =>
                            setBookingFilters((prev) => ({
                              ...prev,
                              sort: e.target.value,
                            }))
                          }
                          width="md:w-[185px]"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </FilterSelect>

                        <FilterSelect
                          value={bookingFilters.status}
                          onChange={(e) =>
                            setBookingFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          width="md:w-[190px]"
                        >
                          {bookingStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status === "all" ? "All Status" : status}
                            </option>
                          ))}
                        </FilterSelect>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-inner">
                        {filteredBookings.length === 0 ? (
                          <div className="m-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-medium text-slate-500">
                            No booking history found.
                          </div>
                        ) : (
                          <>
                            <div className="hidden max-h-[520px] overflow-auto lg:block">
                              <table className="min-w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                                  <tr className="border-b border-slate-200">
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Booking ID
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Tour
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Date
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Status
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredBookings.map((booking) => (
                                    <tr
                                      key={booking.id}
                                      className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                                    >
                                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                        {booking.reference}
                                      </td>
                                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                        {booking.tour_title}
                                      </td>
                                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                        {formatDateOnly(booking.booking_date)}
                                      </td>
                                      <td className="px-4 py-4">
                                        <span
                                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getBookingStatusTone(
                                            booking.booking_status
                                          )}`}
                                        >
                                          {booking.booking_status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                        {formatCurrency(booking.total_price)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="max-h-[520px] space-y-3 overflow-auto p-3 lg:hidden">
                              {filteredBookings.map((booking) => (
                                <motion.div
                                  key={booking.id}
                                  whileHover={{ y: -2 }}
                                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {booking.reference}
                                      </p>
                                      <p className="mt-1 text-sm font-medium text-slate-500">
                                        {booking.tour_title}
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getBookingStatusTone(
                                        booking.booking_status
                                      )}`}
                                    >
                                      {booking.booking_status}
                                    </span>
                                  </div>
                                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Date
                                      </p>
                                      <p className="mt-1 font-semibold text-slate-800">
                                        {formatDateOnly(booking.booking_date)}
                                      </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Total
                                      </p>
                                      <p className="mt-1 font-semibold text-slate-800">
                                        {formatCurrency(booking.total_price)}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.14 }}
                      className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Reviews
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Review list with quick moderation controls.
                          </p>
                        </div>
                        <div className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                          {filteredReviews.length} Result{filteredReviews.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
                        <FilterInput
                          value={reviewFilters.q}
                          onChange={(e) =>
                            setReviewFilters((prev) => ({
                              ...prev,
                              q: e.target.value,
                            }))
                          }
                          placeholder="Search tour or review"
                        />

                        <FilterSelect
                          value={reviewFilters.sort}
                          onChange={(e) =>
                            setReviewFilters((prev) => ({
                              ...prev,
                              sort: e.target.value,
                            }))
                          }
                          width="md:w-[185px]"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </FilterSelect>

                        <FilterSelect
                          value={reviewFilters.status}
                          onChange={(e) =>
                            setReviewFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          width="md:w-[190px]"
                        >
                          {reviewStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status === "all" ? "All Ratings" : `${status}/5`}
                            </option>
                          ))}
                        </FilterSelect>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-inner">
                        {filteredReviews.length === 0 ? (
                          <div className="m-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-medium text-slate-500">
                            No reviews found.
                          </div>
                        ) : (
                          <>
                            <div className="hidden max-h-[520px] overflow-auto lg:block">
                              <table className="min-w-full border-collapse">
                                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                                  <tr className="border-b border-slate-200">
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Tour
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Rating
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Date
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Review
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredReviews.map((review) => (
                                    <tr
                                      key={review.id}
                                      className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                                    >
                                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                        {review.tour_title}
                                      </td>
                                      <td className="px-4 py-4">
                                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                          {review.rating}/5
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                        {formatDateTime(review.created_at)}
                                      </td>
                                      <td className="max-w-[320px] px-4 py-4 text-sm leading-6 text-slate-700">
                                        {review.comment || "-"}
                                      </td>
                                      <td className="px-4 py-4">
                                        <motion.button
                                          whileHover={{ y: -1 }}
                                          whileTap={{ scale: 0.98 }}
                                          type="button"
                                          onClick={() => setReviewToDelete(review)}
                                          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                        >
                                          <FiTrash2 size={16} />
                                          Delete
                                        </motion.button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="max-h-[520px] space-y-3 overflow-auto p-3 lg:hidden">
                              {filteredReviews.map((review) => (
                                <motion.div
                                  key={review.id}
                                  whileHover={{ y: -2 }}
                                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {review.tour_title}
                                      </p>
                                      <p className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        {review.rating}/5
                                      </p>
                                    </div>
                                    <motion.button
                                      whileTap={{ scale: 0.96 }}
                                      type="button"
                                      onClick={() => setReviewToDelete(review)}
                                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                                    >
                                      Delete
                                    </motion.button>
                                  </div>
                                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      Date
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                      {formatDateTime(review.created_at)}
                                    </p>
                                  </div>
                                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                      Review
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-slate-700">
                                      {review.comment || "-"}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={statusModalOpen}
        title={tourist?.is_blocked ? "Unblock Tourist" : "Block Tourist"}
        message={
          tourist?.is_blocked
            ? "Are you sure you want to unblock this tourist?"
            : "Are you sure you want to block this tourist?"
        }
        confirmLabel={tourist?.is_blocked ? "Unblock Tourist" : "Block Tourist"}
        confirmClassName={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
          tourist?.is_blocked
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
            : "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
        }`}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        submitting={statusSubmitting}
      />

      <ConfirmModal
        open={!!reviewToDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        confirmLabel="Delete Review"
        confirmClassName="rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteReview}
        submitting={deleteSubmitting}
      />
    </main>
  );
}