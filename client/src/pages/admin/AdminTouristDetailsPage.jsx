// client/src/pages/admin/AdminTouristDetailsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiSearch,
  FiSliders,
} from "react-icons/fi";
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
      className={`inline-flex rounded-xl px-4 py-1.5 text-[15px] font-semibold ${
        blocked
          ? "bg-red-100 text-red-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[22px] font-bold text-[#183128]">{title}</h3>
        </div>

        <div className="px-6 py-5">
          <p className="text-[16px] text-gray-700">{message}</p>

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
              className={confirmClassName}
            >
              {submitting ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function matchesSearch(values, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return values.some((value) =>
    String(value || "").toLowerCase().includes(q)
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
      new Set(bookings.map((item) => String(item.booking_status || "").trim()).filter(Boolean))
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
        [
          review.tour_title,
          review.rating,
          review.created_at,
          review.comment,
        ],
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
    <main className="h-screen overflow-hidden bg-[#f5f8f5]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="tourists" />

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-4">
          <div className="pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-[30px] leading-tight font-bold text-[#183128]">
                  Tourist Profile
                </h1>
                <p className="mt-1 text-[16px] font-semibold text-[#73917f]">
                  View details and manage tourist account
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/tourists")}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d7e3da] bg-white px-5 py-3 text-[16px] font-semibold text-[#183128] hover:bg-[#f7faf7]"
              >
                <FiArrowLeft size={18} />
                Back to Manage Tourists
              </button>
            </div>

            {pageError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            )}

            {loading ? (
              <div className="mt-6 rounded-2xl border border-[#d7e3da] bg-white px-6 py-10 text-center text-gray-600 shadow-sm">
                Loading tourist details...
              </div>
            ) : !tourist ? (
              <div className="mt-6 rounded-2xl border border-[#d7e3da] bg-white px-6 py-10 text-center text-gray-600 shadow-sm">
                Tourist not found.
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                  <div className="rounded-2xl border border-[#d7e3da] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-[18px] font-bold text-[#183128]">
                        Account Overview
                      </h2>
                      <StatusBadge blocked={tourist.is_blocked} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#d7e3da] bg-[#f8fbf8] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#73917f]">
                          Tourist Name
                        </p>
                        <p className="mt-2 text-[17px] font-semibold text-[#183128]">
                          {tourist.name || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#d7e3da] bg-[#f8fbf8] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#73917f]">
                          Email
                        </p>
                        <p className="mt-2 break-words text-[17px] font-semibold text-[#183128]">
                          {tourist.email || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#d7e3da] bg-[#f8fbf8] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#73917f]">
                          Phone
                        </p>
                        <p className="mt-2 text-[17px] font-semibold text-[#183128]">
                          {tourist.phone || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#d7e3da] bg-[#f8fbf8] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#73917f]">
                          Signup Date
                        </p>
                        <p className="mt-2 text-[17px] font-semibold text-[#183128]">
                          {tourist.created_at || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#d7e3da] bg-[#f8fbf8] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#73917f]">
                          Account Status
                        </p>
                        <p className="mt-2 text-[17px] font-semibold text-[#183128]">
                          {tourist.is_blocked ? "Blocked" : "Active"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setStatusModalOpen(true)}
                        className={`rounded-xl px-5 py-3 text-[16px] font-semibold text-white ${
                          tourist.is_blocked
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {tourist.is_blocked ? "Unblock Tourist" : "Block Tourist"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d7e3da] bg-white p-4 shadow-sm">
                    <h2 className="text-[18px] font-bold text-[#183128]">
                      Activity Summary
                    </h2>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-[#e7f1eb] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#416555]">
                          Total Bookings
                        </p>
                        <p className="mt-3 text-[32px] leading-none font-bold text-[#183128]">
                          {tourist.total_bookings || 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#e7f1eb] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#416555]">
                          Total Reviews
                        </p>
                        <p className="mt-3 text-[32px] leading-none font-bold text-[#183128]">
                          {tourist.total_reviews || 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#e7f1eb] px-4 py-4">
                        <p className="text-[14px] font-semibold text-[#416555]">
                          Wishlist Items
                        </p>
                        <p className="mt-3 text-[32px] leading-none font-bold text-[#183128]">
                          {tourist.total_wishlists || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-[#d7e3da] bg-white p-4 shadow-sm">
                    <h2 className="text-[18px] font-bold text-[#183128]">
                      Booking History
                    </h2>

                    <div className="mt-4 flex flex-col gap-3 md:flex-row">
                      <div className="relative w-full">
                        <FiSearch
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                        />
                        <input
                          type="text"
                          value={bookingFilters.q}
                          onChange={(e) =>
                            setBookingFilters((prev) => ({
                              ...prev,
                              q: e.target.value,
                            }))
                          }
                          placeholder="Search booking, tour or status"
                          className="h-[44px] w-full rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#183128] placeholder:text-[#73917f] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="relative w-full md:w-[180px]">
                        <FiSliders
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                        />
                        <select
                          value={bookingFilters.sort}
                          onChange={(e) =>
                            setBookingFilters((prev) => ({
                              ...prev,
                              sort: e.target.value,
                            }))
                          }
                          className="h-[44px] w-full appearance-none rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </select>
                      </div>

                      <div className="relative w-full md:w-[190px]">
                        <FiSliders
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                        />
                        <select
                          value={bookingFilters.status}
                          onChange={(e) =>
                            setBookingFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="h-[44px] w-full appearance-none rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {bookingStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status === "all" ? "All Status" : status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 h-[430px] overflow-y-auto overflow-x-auto rounded-2xl border border-[#dfe8e2]">
                      {filteredBookings.length === 0 ? (
                        <div className="m-4 rounded-xl border border-dashed border-[#d7e3da] px-4 py-8 text-sm text-gray-500">
                          No booking history found.
                        </div>
                      ) : (
                        <table className="min-w-full border-collapse">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-[#dfe8e2]">
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Booking ID
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Tour
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Date
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Status
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Total
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredBookings.map((booking) => (
                              <tr
                                key={booking.id}
                                className="border-b border-[#dfe8e2] last:border-b-0"
                              >
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {booking.reference}
                                </td>
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {booking.tour_title}
                                </td>
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {booking.booking_date}
                                </td>
                                <td className="px-3 py-4">
                                  <span className="inline-flex rounded-xl bg-[#e7f1eb] px-3 py-1 text-[14px] font-semibold text-[#2f5c48]">
                                    {booking.booking_status}
                                  </span>
                                </td>
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {formatCurrency(booking.total_price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d7e3da] bg-white p-4 shadow-sm">
                    <h2 className="text-[18px] font-bold text-[#183128]">
                      Reviews
                    </h2>

                    <div className="mt-4 flex flex-col gap-3 md:flex-row">
                      <div className="relative w-full">
                        <FiSearch
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                        />
                        <input
                          type="text"
                          value={reviewFilters.q}
                          onChange={(e) =>
                            setReviewFilters((prev) => ({
                              ...prev,
                              q: e.target.value,
                            }))
                          }
                          placeholder="Search tour or review"
                          className="h-[44px] w-full rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#183128] placeholder:text-[#73917f] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="relative w-full md:w-[180px]">
                        <FiSliders
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                        />
                        <select
                          value={reviewFilters.sort}
                          onChange={(e) =>
                            setReviewFilters((prev) => ({
                              ...prev,
                              sort: e.target.value,
                            }))
                          }
                          className="h-[44px] w-full appearance-none rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </select>
                      </div>

                      <div className="relative w-full md:w-[180px]">
                        <FiSliders
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73917f]"
                        />
                        <select
                          value={reviewFilters.status}
                          onChange={(e) =>
                            setReviewFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="h-[44px] w-full appearance-none rounded-xl border border-[#d7e3da] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#183128] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {reviewStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status === "all" ? "All Ratings" : `${status}/5`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 h-[430px] overflow-y-auto overflow-x-auto rounded-2xl border border-[#dfe8e2]">
                      {filteredReviews.length === 0 ? (
                        <div className="m-4 rounded-xl border border-dashed border-[#d7e3da] px-4 py-8 text-sm text-gray-500">
                          No reviews found.
                        </div>
                      ) : (
                        <table className="min-w-full border-collapse">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-[#dfe8e2]">
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Tour
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Rating
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Date
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Review
                              </th>
                              <th className="px-3 py-4 text-left text-[15px] font-semibold text-[#73917f]">
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredReviews.map((review) => (
                              <tr
                                key={review.id}
                                className="border-b border-[#dfe8e2] last:border-b-0"
                              >
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {review.tour_title}
                                </td>
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {review.rating}/5
                                </td>
                                <td className="px-3 py-4 text-[15px] font-semibold text-[#1b1f1d]">
                                  {review.created_at}
                                </td>
                                <td className="px-3 py-4 text-[15px] text-[#1b1f1d]">
                                  {review.comment}
                                </td>
                                <td className="px-3 py-4">
                                  <button
                                    type="button"
                                    onClick={() => setReviewToDelete(review)}
                                    className="rounded-xl border border-red-300 px-4 py-2 text-[15px] font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
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
        confirmClassName={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
          tourist?.is_blocked
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-red-600 hover:bg-red-700"
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
        confirmClassName="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteReview}
        submitting={deleteSubmitting}
      />
    </main>
  );
}
