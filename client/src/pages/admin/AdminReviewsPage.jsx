// client/src/pages/admin/AdminReviewsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiTrash2,
  FiStar,
  FiFilter,
  FiSliders,
  FiMessageSquare,
  FiUser,
  FiBriefcase,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  getAdminReviews,
  deleteAdminReview,
} from "../../api/adminReviewsApi";

function RatingStars({ value, size = 15 }) {
  const count = Number(value || 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar
          key={i}
          size={size}
          className={
            i < count ? "fill-amber-400 text-amber-400" : "text-slate-300"
          }
        />
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_45%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full xl:flex-[1.35]">
      <FiSearch
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  icon,
  width = "md:w-[190px]",
}) {
  const Icon = icon;

  return (
    <div className={`relative w-full xl:flex-none ${width}`}>
      <Icon
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

function ConfirmDeleteModal({ review, onClose, onConfirm, deleting }) {
  return (
    <AnimatePresence>
      {review ? (
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
                Delete Review
              </h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-[15px] leading-7 text-slate-600">
                Are you sure you want to delete this review by{" "}
                <span className="font-semibold text-slate-900">
                  {review.tourist_name || "this tourist"}
                </span>
                ?
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {review.tour_title || "-"}
                </p>
                <div className="mt-2">
                  <RatingStars value={review.rating} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {review.comment || "No comment"}
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={deleting}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Review"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ReviewCard({ review, onDelete }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900">
              {review.tour_title || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {review.agency_name || "-"}
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            {review.rating}/5
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <FiUser size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {review.tourist_name || "-"}
            </p>
            <div className="mt-1">
              <RatingStars value={review.rating} size={14} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            {review.comment || "No review comment."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(review)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          <FiTrash2 size={16} />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    rating: "All",
    sort: "newest",
  });

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminReviews({
        q: filters.q,
        rating: filters.rating,
        sort: filters.sort,
      });
      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const id = setTimeout(() => {
      loadReviews();
    }, 250);

    return () => clearTimeout(id);
  }, [loadReviews]);

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    try {
      setDeleting(true);
      await deleteAdminReview(reviewToDelete.id);
      setReviewToDelete(null);
      await loadReviews();
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => reviews, [reviews]);

  const totalReviews = filtered.length;

  const avgRating = useMemo(() => {
    if (!filtered.length) return "0.0";
    const total = filtered.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );
    return (total / filtered.length).toFixed(1);
  }, [filtered]);

  const lowRatings = useMemo(
    () => filtered.filter((item) => Number(item.rating || 0) <= 2).length,
    [filtered]
  );

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f2f7f4_46%,#edf7f0_100%)]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="reviews" />

        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 xl:px-7">
          <div className="mx-auto max-w-[1700px] pb-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(14,165,233,0.08),transparent_24%)]" />

              <div className="relative flex flex-col gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Admin Panel
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Reviews
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                    Monitor tourist feedback across all tours with a cleaner and more structured review dashboard.
                  </p>
                </div>
              </div>

              <div
                className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
                style={{ perspective: "1200px" }}
              >
                <StatCard
                  icon={<FiMessageSquare size={22} />}
                  label="Visible Reviews"
                  value={totalReviews}
                  tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                />
                <StatCard
                  icon={<FiTrendingUp size={22} />}
                  label="Average Rating"
                  value={avgRating}
                  tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                />
                <StatCard
                  icon={<FiAlertCircle size={22} />}
                  label="Low Ratings"
                  value={lowRatings}
                  tint="border-rose-100 bg-gradient-to-br from-rose-50 to-white"
                />
              </div>

              <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <FilterInput
                    value={filters.q}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, q: e.target.value }))
                    }
                    placeholder="Search tourist, tour or agency..."
                  />

                  <FilterSelect
                    value={filters.rating}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        rating: e.target.value,
                      }))
                    }
                    icon={FiFilter}
                    width="md:w-[180px]"
                  >
                    <option value="All">All Ratings</option>
                    <option value="5">5 Star</option>
                    <option value="4">4 Star</option>
                    <option value="3">3 Star</option>
                    <option value="2">2 Star</option>
                    <option value="1">1 Star</option>
                  </FilterSelect>

                  <FilterSelect
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sort: e.target.value }))
                    }
                    icon={FiSliders}
                    width="md:w-[205px]"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </FilterSelect>
                </div>
              </div>

              <div className="relative mt-6 overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                {loading ? (
                  <div className="px-4 py-16">
                    <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
                      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                      <p className="text-sm font-semibold text-slate-500">
                        Loading reviews...
                      </p>
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-4 py-16">
                    <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        No reviews found.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto xl:block">
                      <table className="min-w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                          <tr className="border-b border-slate-200">
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Tourist
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Tour
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Agency
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Rating
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Review
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filtered.map((r, index) => (
                            <motion.tr
                              key={r.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, delay: index * 0.02 }}
                              className="border-b border-slate-100 text-[15px] transition hover:bg-slate-50/70 last:border-b-0"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                    <FiUser size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                      {r.tourist_name || "-"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                {r.tour_title}
                              </td>

                              <td className="px-5 py-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                                  <FiBriefcase size={14} />
                                  {r.agency_name}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-1">
                                  <RatingStars value={r.rating} />
                                </div>
                              </td>

                              <td className="max-w-[340px] px-5 py-4">
                                <p className="line-clamp-2 text-sm leading-6 text-slate-700">
                                  {r.comment || "No review comment."}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => setReviewToDelete(r)}
                                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                >
                                  <FiTrash2 size={16} />
                                  Delete
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-4 p-4 xl:hidden">
                      {filtered.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          onDelete={setReviewToDelete}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <ConfirmDeleteModal
        review={reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </main>
  );
}