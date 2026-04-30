// client/src/pages/agency/AgencyReviewsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiChevronDown,
  FiSearch,
  FiStar,
  FiMessageSquare,
  FiCalendar,
  FiUser,
  FiMapPin,
} from "react-icons/fi";
import AgencySidebar from "../../components/agency/AgencySidebar";
import AgencyNotificationsDrawer from "../../components/agency/AgencyNotificationsDrawer";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import { fetchAgencyReviews } from "../../api/agencyReviewsApi";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  "https://raul-lama-smart-tourism-management-system-production.up.railway.app";

function buildTouristAvatarUrl(profileImage) {
  const raw = String(profileImage || "").trim();
  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${API_ORIGIN}${raw}`;
  }

  return `${API_ORIGIN}/${raw}`;
}

function TouristAvatar({ name, profileImage }) {
  const [imgError, setImgError] = useState(false);

  const avatarUrl = useMemo(
    () => buildTouristAvatarUrl(profileImage),
    [profileImage]
  );

  const initials = String(name || "U").trim().charAt(0).toUpperCase() || "U";

  if (!avatarUrl || imgError) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 shadow-inner">
        <span className="text-sm font-bold">{initials}</span>
      </span>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name || "Tourist"}
      className="h-10 w-10 shrink-0 rounded-2xl object-cover shadow-inner"
      onError={() => setImgError(true)}
    />
  );
}

function RatingBadge({ rating }) {
  const value = Number(rating || 0);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/90 px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm shadow-amber-100/60">
      <FiStar size={14} className="fill-amber-400 text-amber-500" />
      {value.toFixed(value % 1 === 0 ? 0 : 1)}
    </span>
  );
}

function StatCard({ label, value, icon, tone = "emerald" }) {
  const tones = {
    emerald:
      "border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white text-emerald-700",
    amber:
      "border-amber-200/60 bg-gradient-to-br from-amber-50 to-white text-amber-700",
    sky: "border-sky-200/60 bg-gradient-to-br from-sky-50 to-white text-sky-700",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 ${tones[tone]}`}
    >
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/50 blur-2xl transition duration-300 group-hover:scale-125" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm backdrop-blur">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-80" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <TouristAvatar
              name={review.tourist_name}
              profileImage={review.tourist_profile_image}
            />
            <span className="truncate">{review.tourist_name || "-"}</span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <FiMapPin size={14} />
            <span className="truncate">{review.tour_name || "-"}</span>
          </div>
        </div>

        <RatingBadge rating={review.rating} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <FiMessageSquare size={14} />
          Review
        </div>
        <p className="text-sm leading-7 text-slate-700">
          {review.comment?.trim() || "No comment provided."}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 font-medium text-emerald-700">
          <FiCalendar size={14} />
          {review.formattedDate}
        </div>
      </div>
    </div>
  );
}

export default function AgencyReviewsPage() {
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [rating, setRating] = useState("any");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
    }, 250);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;

    async function loadReviews() {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetchAgencyReviews(
          {
            search: query,
            sort,
            rating,
            page: 1,
            limit: 100,
          },
          token
        );

        setReviews(res.reviews || []);
      } catch (err) {
        console.error("Failed to load agency reviews", err);
        setPageError(err?.response?.data?.message || "Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [token, query, sort, rating]);

  const handleOpenNotifications = async () => {
    setDrawerOpen(true);

    try {
      await refresh?.();
    } catch {}
  };

  const mappedReviews = useMemo(() => {
    return reviews.map((review) => ({
      ...review,
      formattedDate: review.created_at
        ? new Date(review.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
    }));
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (!mappedReviews.length) return "0.0";
    const total = mappedReviews.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );
    return (total / mappedReviews.length).toFixed(1);
  }, [mappedReviews]);

  const fiveStarCount = useMemo(() => {
    return mappedReviews.filter((item) => Number(item.rating) === 5).length;
  }, [mappedReviews]);

  const TABLE_GRID =
    "grid grid-cols-[1.2fr_1.2fr_120px_2fr_140px] gap-4 xl:gap-6";

  return (
    <>
      <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_24%),linear-gradient(180deg,_#edf7f1_0%,_#f8fafc_55%,_#eef8ff_100%)]">
        <div className="flex h-full">
          <div className="h-full shrink-0">
            <AgencySidebar />
          </div>

          <main className="relative flex-1 overflow-y-auto">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-[8%] top-8 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
              <div className="absolute right-[10%] top-24 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="absolute bottom-10 left-1/3 h-44 w-44 rounded-full bg-teal-200/20 blur-3xl" />
            </div>

            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Tourism Nepal
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Reviews overview
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenNotifications}
                    className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <FiBell size={19} />
                    {Number(unreadCount || 0) > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-[24px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-red-200">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <StatCard
                    label="Total Reviews"
                    value={mappedReviews.length}
                    icon={<FiMessageSquare size={20} />}
                    tone="emerald"
                  />
                  <StatCard
                    label="Average Rating"
                    value={averageRating}
                    icon={<FiStar size={20} className="fill-current" />}
                    tone="amber"
                  />
                  <StatCard
                    label="5 Star Reviews"
                    value={fiveStarCount}
                    icon={<FiStar size={20} className="fill-current" />}
                    tone="sky"
                  />
                </div>

                <div className="rounded-[30px] border border-white/70 bg-white/70 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  <div className="border-b border-slate-200/70 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="relative w-full xl:max-w-md">
                        <FiSearch
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search by tour or tourist"
                          className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/90 py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative">
                          <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="h-12 min-w-[170px] appearance-none rounded-2xl border border-slate-200/80 bg-white/90 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          >
                            <option value="newest">Sort: Newest</option>
                            <option value="oldest">Sort: Oldest</option>
                          </select>
                          <FiChevronDown
                            size={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                          />
                        </div>

                        <div className="relative">
                          <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="h-12 min-w-[160px] appearance-none rounded-2xl border border-slate-200/80 bg-white/90 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          >
                            <option value="any">Rating: Any</option>
                            <option value="5">Rating: 5</option>
                            <option value="4">Rating: 4</option>
                            <option value="3">Rating: 3</option>
                            <option value="2">Rating: 2</option>
                            <option value="1">Rating: 1</option>
                          </select>
                          <FiChevronDown
                            size={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {pageError ? (
                      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {pageError}
                      </div>
                    ) : null}

                    {loading ? (
                      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm"
                          >
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
                                <div className="min-w-0">
                                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                                  <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-100" />
                                </div>
                              </div>
                              <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200" />
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                              <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
                              <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                              <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-slate-100" />
                            </div>
                            <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    ) : mappedReviews.length === 0 ? (
                      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-gradient-to-br from-white to-slate-50 px-6 text-center">
                        <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-inner">
                          <FiMessageSquare size={26} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          No reviews found
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                          Try changing your search text, sort, or rating filter to
                          find more results.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 xl:hidden md:grid-cols-2 2xl:grid-cols-3">
                          {mappedReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                          ))}
                        </div>

                        <div className="hidden overflow-hidden rounded-[28px] border border-slate-200/80 bg-white xl:block">
                          <div
                            className={[
                              TABLE_GRID,
                              "border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-6 py-4 text-sm font-bold text-slate-800",
                            ].join(" ")}
                          >
                            <div>Tourist Name</div>
                            <div>Tour Name</div>
                            <div>Rating</div>
                            <div>Comment</div>
                            <div>Date</div>
                          </div>

                          {mappedReviews.map((review, index) => (
                            <div
                              key={review.id}
                              className={[
                                TABLE_GRID,
                                "items-center px-6 py-5 transition duration-300 hover:bg-emerald-50/40",
                                index !== mappedReviews.length - 1
                                  ? "border-b border-slate-100"
                                  : "",
                              ].join(" ")}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <TouristAvatar
                                    name={review.tourist_name}
                                    profileImage={review.tourist_profile_image}
                                  />
                                  <span className="truncate text-sm font-semibold text-slate-800">
                                    {review.tourist_name || "-"}
                                  </span>
                                </div>
                              </div>

                              <div className="min-w-0 text-sm font-medium text-slate-700">
                                <span className="truncate">{review.tour_name || "-"}</span>
                              </div>

                              <div>
                                <RatingBadge rating={review.rating} />
                              </div>

                              <div className="text-sm leading-7 text-slate-700">
                                {review.comment?.trim() || "No comment provided."}
                              </div>

                              <div className="text-sm font-semibold text-emerald-800/90">
                                {review.formattedDate}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <AgencyNotificationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}