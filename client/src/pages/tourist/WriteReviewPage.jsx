// client/src/pages/tourist/WriteReviewPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings } from "../../api/bookingApi";
import {
  fetchTourReviews,
  submitReview,
  updateReview,
  deleteReview,
} from "../../api/reviewApi";
import {
  toPublicImageUrl,
  FALLBACK_TOUR_IMG,
} from "../../utils/publicImageUrl";
import {
  FaStar,
  FaRegStar,
  FaTimes,
  FaPaperPlane,
  FaArrowLeft,
  FaPen,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

function formatReviewDate(value) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBookingDateLabel(row) {
  const raw = String(row?.selected_date_label || "").trim();

  if (raw) {
    return raw.replace(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/g, "").trim();
  }

  if (row?.booking_date) {
    const d = new Date(row.booking_date);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  return "—";
}

function getReviewCardImage(row) {
  const raw =
    row?.tour_image_url ||
    row?.image_url ||
    row?.tour_image ||
    row?.tourImage ||
    row?.cover_image ||
    "";

  return toPublicImageUrl(raw) || FALLBACK_TOUR_IMG;
}

function getPopupVariant(title = "") {
  const t = String(title).toLowerCase();

  if (
    t.includes("unable") ||
    t.includes("failed") ||
    t.includes("required") ||
    t.includes("short") ||
    t.includes("delete")
  ) {
    return {
      icon: <FaExclamationCircle />,
      iconWrap: "bg-red-100 text-red-600 ring-8 ring-red-50",
      button: "bg-red-600 hover:bg-red-700 text-white",
    };
  }

  return {
    icon: <FaCheckCircle />,
    iconWrap: "bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WriteReviewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const params = useParams();
  const [sp] = useSearchParams();
  const bookingId = params.bookingId || sp.get("booking");

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const [popup, setPopup] = useState({ open: false, title: "", message: "" });
  const closePopup = () => setPopup({ open: false, title: "", message: "" });

  const [deletePopup, setDeletePopup] = useState({
    open: false,
    reviewId: null,
  });

  const openDeletePopup = (reviewId) => {
    setDeletePopup({ open: true, reviewId });
  };

  const closeDeletePopup = () => {
    setDeletePopup({ open: false, reviewId: null });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        if (!bookingId) {
          navigate("/bookings", { replace: true });
          return;
        }

        const res = await fetchMyBookings({});
        const list = Array.isArray(res?.data) ? res.data : [];
        const found = list.find((x) => String(x.id) === String(bookingId));

        if (!found) {
          navigate("/bookings", { replace: true });
          return;
        }

        if (
          String(found.payment_status) !== "Paid" ||
          String(found.booking_status) !== "Completed"
        ) {
          navigate("/bookings", { replace: true });
          return;
        }

        setRow(found);
      } catch (error) {
        console.error("Review access blocked:", error);
        navigate("/bookings", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, bookingId, navigate]);

  const loadReviews = async (currentRow) => {
    if (!currentRow?.tour_id || !currentRow?.agency_id) return;

    try {
      setReviewsLoading(true);

      const res = await fetchTourReviews({
        tourId: currentRow.tour_id,
        agencyId: currentRow.agency_id,
      });

      const list = Array.isArray(res?.data) ? res.data : [];
      setReviews(list);

      const ownReview = list.find(
        (item) => item.is_owner && String(item.booking_id) === String(currentRow.id)
      );

      if (ownReview) {
        setEditingReviewId(ownReview.id);
        setRating(Number(ownReview.rating) || 0);
        setComment(ownReview.comment || "");
      } else {
        setEditingReviewId(null);
        setRating(0);
        setComment("");
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
      setEditingReviewId(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!row) return;
    loadReviews(row);
  }, [row]);

  const topInfo = useMemo(() => {
    if (!row) {
      return {
        title: "—",
        agency: "—",
        date: "—",
        image: FALLBACK_TOUR_IMG,
      };
    }

    return {
      title: row.tour_title || row.title || "Tour",
      agency: row.agency_name || "Agency",
      date: formatBookingDateLabel(row),
      image: getReviewCardImage(row),
    };
  }, [row]);

  const resetForm = () => {
    setEditingReviewId(null);
    setRating(0);
    setComment("");
  };

  const startEdit = (review) => {
    setEditingReviewId(review.id);
    setRating(Number(review.rating) || 0);
    setComment(review.comment || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);

      setPopup({
        open: true,
        title: "Review deleted",
        message: "Your review has been deleted successfully.",
      });

      if (editingReviewId === reviewId) {
        resetForm();
      }

      if (row) {
        await loadReviews(row);
      }
    } catch (error) {
      setPopup({
        open: true,
        title: "Unable to delete review",
        message: error?.response?.data?.message || "Failed to delete review.",
      });
    } finally {
      closeDeletePopup();
    }
  };

  const handleSubmit = async () => {
    if (!row?.id) return;

    if (rating < 1) {
      setPopup({
        open: true,
        title: "Star rating required",
        message: "Please select at least 1 star before submitting.",
      });
      return;
    }

    if (comment.trim().length < 5) {
      setPopup({
        open: true,
        title: "Comment too short",
        message: "Write a few words about your experience.",
      });
      return;
    }

    try {
      setSubmitting(true);

      let res;

      if (editingReviewId) {
        res = await updateReview(editingReviewId, {
          rating,
          comment: comment.trim(),
        });
      } else {
        res = await submitReview({
          bookingId: row.id,
          rating,
          comment: comment.trim(),
        });
      }

      setPopup({
        open: true,
        title: editingReviewId ? "Review updated" : "Review submitted",
        message:
          res?.message ||
          (editingReviewId
            ? "Your review has been updated successfully."
            : "Your review has been submitted successfully."),
      });

      if (row) {
        await loadReviews(row);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (editingReviewId
          ? "Failed to update review."
          : "Failed to submit review.");

      setPopup({
        open: true,
        title: editingReviewId
          ? "Unable to update review"
          : "Unable to submit review",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const ownReviewForThisBooking = reviews.find(
    (item) => item.is_owner && String(item.booking_id) === String(row?.id)
  );

  const popupVariant = getPopupVariant(popup.title);

  return (
    <>
      <NavbarTourist />

      <main className="min-h-screen bg-[#e6f4ec] pt-6 pb-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-4 flex items-center justify-between"
          >
            <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
              Write a Review
            </h1>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/bookings")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50"
            >
              <FaArrowLeft /> Back to Bookings
            </motion.button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.05 }}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="p-5">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-start gap-3"
                  >
                    <motion.img
                      whileHover={{ scale: 1.04 }}
                      src={topInfo.image}
                      alt={topInfo.title}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_TOUR_IMG;
                      }}
                      className="h-14 w-14 rounded-xl border object-cover"
                    />

                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {topInfo.title}
                      </div>
                      <div className="mt-0.5 text-sm text-emerald-700">
                        {topInfo.agency} • {topInfo.date}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.35 }}
                    className="mt-5"
                  >
                    <div className="mb-2 text-sm font-semibold text-gray-700">
                      Star rating
                    </div>

                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => {
                        const active = rating >= i;

                        return (
                          <motion.button
                            key={i}
                            type="button"
                            whileHover={{ y: -2, scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setRating(i)}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                              active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 bg-white text-gray-500"
                            }`}
                          >
                            {active ? <FaStar /> : <FaRegStar />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.35 }}
                    className="mt-4"
                  >
                    <div className="mb-2 text-sm font-semibold text-gray-700">
                      Comment
                    </div>

                    <motion.textarea
                      whileFocus={{ scale: 1.002 }}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share details about your experience..."
                      className="min-h-[130px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </motion.div>

                  <AnimatePresence>
                    {ownReviewForThisBooking && !editingReviewId ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                      >
                        You already reviewed this booking. You can edit or delete
                        your review below.
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16, duration: 0.35 }}
                    className="mt-4 flex justify-end gap-2"
                  >
                    {editingReviewId ? (
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetForm}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold"
                      >
                        <FaTimes /> Cancel Edit
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/bookings")}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold"
                      >
                        <FaTimes /> Cancel
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={
                        submitting || (!!ownReviewForThisBooking && !editingReviewId)
                          ? {}
                          : { y: -1 }
                      }
                      whileTap={
                        submitting || (!!ownReviewForThisBooking && !editingReviewId)
                          ? {}
                          : { scale: 0.98 }
                      }
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        !!ownReviewForThisBooking && !editingReviewId
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaPaperPlane />
                      {submitting
                        ? editingReviewId
                          ? "Updating..."
                          : "Submitting..."
                        : editingReviewId
                          ? "Update Review"
                          : "Submit Review"}
                    </motion.button>
                  </motion.div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 p-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="text-lg font-bold text-gray-900"
              >
                Recent Reviews
              </motion.div>

              {reviewsLoading ? (
                <div className="mt-4 text-sm text-gray-500">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="mt-4 text-sm text-gray-500">
                  No reviews yet for this tour.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <AnimatePresence initial={false}>
                    {reviews.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-50/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {item.user_name || "Traveller"}
                              {item.is_owner ? (
                                <span className="ml-2 text-xs font-medium text-emerald-700">
                                  
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {formatReviewDate(item.created_at)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) =>
                              star <= Number(item.rating) ? (
                                <FaStar key={star} />
                              ) : (
                                <FaRegStar key={star} />
                              )
                            )}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-gray-700">
                          {item.comment}
                        </p>

                        {item.is_owner ? (
                          <div className="mt-3 flex justify-end gap-2">
                            <motion.button
                              type="button"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => startEdit(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                            >
                              <FaPen /> Edit
                            </motion.button>

                            <motion.button
                              type="button"
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openDeletePopup(item.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              <FaTrash /> Delete
                            </motion.button>
                          </div>
                        ) : null}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {popup.open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                  className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                >
                  <div className="relative px-6 pt-6 pb-4">
                    <button
                      onClick={closePopup}
                      type="button"
                      className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                    >
                      <FaTimes />
                    </button>

                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        initial={{ scale: 0.86, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.05, duration: 0.22 }}
                        className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${popupVariant.iconWrap}`}
                      >
                        {popupVariant.icon}
                      </motion.div>

                      <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
                        {popup.title}
                      </h3>

                      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                        {popup.message}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={closePopup}
                      type="button"
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${popupVariant.button}`}
                    >
                      Got it
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {deletePopup.open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                  className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                >
                  <div className="relative px-6 pt-6 pb-4">
                    <button
                      onClick={closeDeletePopup}
                      type="button"
                      className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                    >
                      <FaTimes />
                    </button>

                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        initial={{ scale: 0.86, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.05, duration: 0.22 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600 ring-8 ring-red-50"
                      >
                        <FaTrash />
                      </motion.div>

                      <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
                        Delete Review
                      </h3>

                      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                        Are you sure you want to delete your review? This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 px-6 pb-6 pt-2">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={closeDeletePopup}
                      type="button"
                      className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Cancel
                    </motion.button>

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDelete(deletePopup.reviewId)}
                      type="button"
                      className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}