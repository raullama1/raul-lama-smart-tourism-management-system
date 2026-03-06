import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

  return d.toLocaleDateString();
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

export default function WriteReviewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const params = useParams();
  const [sp] = useSearchParams();
  const bookingId = params.bookingId || sp.get("booking");

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
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
        setHover(0);
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
      date:
        row.selected_date_label ||
        (row.booking_date
          ? new Date(row.booking_date).toLocaleDateString()
          : "—"),
      image: getReviewCardImage(row),
    };
  }, [row]);

  const resetForm = () => {
    setEditingReviewId(null);
    setRating(0);
    setHover(0);
    setComment("");
  };

  const startEdit = (review) => {
    setEditingReviewId(review.id);
    setRating(Number(review.rating) || 0);
    setHover(0);
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

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Write a Review
            </h1>

            <button
              onClick={() => navigate("/bookings")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
            >
              <FaArrowLeft /> Back to Bookings
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <img
                      src={topInfo.image}
                      alt={topInfo.title}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_TOUR_IMG;
                      }}
                      className="h-14 w-14 rounded-xl object-cover border"
                    />

                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {topInfo.title}
                      </div>
                      <div className="text-sm text-emerald-700 mt-0.5">
                        {topInfo.agency} • {topInfo.date}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Star rating
                    </div>

                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => {
                        const active = (hover || rating) >= i;

                        return (
                          <button
                            key={i}
                            type="button"
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(i)}
                            className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${
                              active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-white border-gray-200 text-gray-500"
                            }`}
                          >
                            {active ? <FaStar /> : <FaRegStar />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Comment
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share details about your experience..."
                      className="w-full min-h-[130px] rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                    />
                  </div>

                  {ownReviewForThisBooking && !editingReviewId ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      You already reviewed this booking. You can edit or delete
                      your review below.
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-end gap-2">
                    {editingReviewId ? (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                      >
                        <FaTimes /> Cancel Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/bookings")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                      >
                        <FaTimes /> Cancel
                      </button>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        (!!ownReviewForThisBooking && !editingReviewId)
                      }
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane />
                      {submitting
                        ? editingReviewId
                          ? "Updating..."
                          : "Submitting..."
                        : editingReviewId
                        ? "Update Review"
                        : "Submit Review"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 p-5">
              <div className="text-lg font-bold text-gray-900">
                Recent Reviews
              </div>

              {reviewsLoading ? (
                <div className="mt-4 text-sm text-gray-500">
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="mt-4 text-sm text-gray-500">
                  No reviews yet for this tour.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.user_name || "Traveller"}
                            {item.is_owner ? (
                              <span className="ml-2 text-xs font-medium text-emerald-700">
                                (You)
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
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

                      <p className="mt-3 text-sm text-gray-700 leading-6">
                        {item.comment}
                      </p>

                      {item.is_owner ? (
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
                          >
                            <FaPen /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeletePopup(item.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {popup.open && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
              <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <div className="relative px-6 pt-6 pb-4">
                  <button
                    onClick={closePopup}
                    type="button"
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${popupVariant.iconWrap}`}
                    >
                      {popupVariant.icon}
                    </div>

                    <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
                      {popup.title}
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                      {popup.message}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <button
                    onClick={closePopup}
                    type="button"
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${popupVariant.button}`}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}

          {deletePopup.open && (
            <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm px-4">
              <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <div className="relative px-6 pt-6 pb-4">
                  <button
                    onClick={closeDeletePopup}
                    type="button"
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600 ring-8 ring-red-50">
                      <FaTrash />
                    </div>

                    <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
                      Delete Review
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                      Are you sure you want to delete your review? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 px-6 pb-6 pt-2">
                  <button
                    onClick={closeDeletePopup}
                    type="button"
                    className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleDelete(deletePopup.reviewId)}
                    type="button"
                    className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterTourist />
    </>
  );
}
