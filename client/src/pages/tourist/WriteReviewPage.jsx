// client/src/pages/tourist/WriteReviewPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings } from "../../api/bookingApi";
import {
  FaStar,
  FaRegStar,
  FaTimes,
  FaPaperPlane,
  FaArrowLeft,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";

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

  // Reviews (DB-ready)
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  const [popup, setPopup] = useState({ open: false, title: "", message: "" });
  const closePopup = () => setPopup({ open: false, title: "", message: "" });

  // 🔒 HARD GUARD: block direct access
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

        // ❗ only Paid + Completed can even see this page
        if (
          found.payment_status !== "Paid" ||
          found.booking_status !== "Completed"
        ) {
          navigate("/bookings", { replace: true });
          return;
        }

        setRow(found);
        setReviews([]); // will be loaded from DB later
      } catch (e) {
        console.error("Review access blocked:", e);
        navigate("/bookings", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, bookingId, navigate]);

  const topInfo = useMemo(() => {
    if (!row) return { title: "—", agency: "—", date: "—", image: "" };
    return {
      title: row.tour_title,
      agency: row.agency_name,
      date:
        row.selected_date_label ||
        new Date(row.booking_date).toLocaleDateString(),
      image: row.tour_image_url,
    };
  }, [row]);

  const handleSubmit = () => {
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

    // UI-first only
    setPopup({
      open: true,
      title: "Review submitted (UI)",
      message:
        "Your review will be saved once the review system is connected to the database.",
    });
  };

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
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(i)}
                            className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
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
                      className="w-full min-h-[130px] rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => navigate("/bookings")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold"
                    >
                      <FaTimes /> Cancel
                    </button>

                    <button
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                    >
                      <FaPaperPlane /> Submit Review
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 p-5">
              <div className="text-lg font-bold text-gray-900">
                Recent Reviews
              </div>
              <div className="text-sm text-emerald-700 mt-1">
                Reviews submitted by travellers for this tour will appear here.
              </div>

              <div className="mt-4 text-sm text-gray-500">
                No reviews yet for this tour.
              </div>
            </div>
          </div>

          {popup.open && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
                <div className="p-5 border-b flex justify-between">
                  <div className="font-bold">{popup.title}</div>
                  <button onClick={closePopup}>
                    <FaTimesCircle />
                  </button>
                </div>
                <div className="p-5 text-sm">{popup.message}</div>
                <div className="p-5 pt-0 flex justify-end">
                  <button
                    onClick={closePopup}
                    className="px-4 py-2 rounded-xl border"
                  >
                    OK
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
