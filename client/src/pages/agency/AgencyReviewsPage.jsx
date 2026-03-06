// client/src/pages/agency/AgencyReviewsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FiBell, FiChevronDown, FiSearch, FiStar } from "react-icons/fi";
import AgencySidebar from "../../components/agency/AgencySidebar";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { fetchAgencyReviews } from "../../api/agencyReviewsApi";

function RatingBadge({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
      <FiStar size={14} className="fill-amber-400 text-amber-500" />
      {Number(rating).toFixed(rating % 1 === 0 ? 0 : 1)}
    </span>
  );
}

export default function AgencyReviewsPage() {
  const { token } = useAgencyAuth();

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
        setPageError(
          err?.response?.data?.message || "Failed to load reviews."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [token, query, sort, rating]);

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

  const TABLE_GRID =
    "grid grid-cols-[1.1fr_1.2fr_120px_1.9fr_140px] gap-4";
  const GLASS_HEADER =
    "border-b border-white/40 bg-white/45 backdrop-blur-md supports-[backdrop-filter]:bg-emerald-100/35";

  return (
    <div className="h-screen overflow-hidden bg-[#dfe9e2]">
      <div className="flex h-full">
        <div className="h-full shrink-0">
          <AgencySidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex items-start justify-between border-b border-emerald-100 px-6 py-5">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  All Reviews
                </h1>
              </div>

              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-700 transition hover:bg-emerald-50"
              >
                <FiBell size={18} />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">
                  3
                </span>
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-md">
                  <FiSearch
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Tour / Tourist"
                    className="w-full rounded-xl border border-emerald-100 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="appearance-none rounded-xl border border-emerald-100 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="oldest">Sort: Oldest</option>
                    </select>
                    <FiChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="appearance-none rounded-xl border border-emerald-100 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {pageError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {pageError}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
                <div
                  className={[
                    TABLE_GRID,
                    GLASS_HEADER,
                    "px-4 py-4 text-sm font-bold text-emerald-900/85",
                  ].join(" ")}
                >
                  <div>Tourist Name</div>
                  <div>Tour Name</div>
                  <div>Rating</div>
                  <div>Comment</div>
                  <div>Date</div>
                </div>

                {loading ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading reviews...
                  </div>
                ) : mappedReviews.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    No reviews found.
                  </div>
                ) : (
                  mappedReviews.map((review, index) => (
                    <div
                      key={review.id}
                      className={[
                        TABLE_GRID,
                        "items-center px-4 py-4",
                        index !== mappedReviews.length - 1
                          ? "border-b border-emerald-100"
                          : "",
                      ].join(" ")}
                    >
                      <div className="text-sm font-medium leading-6 text-slate-700">
                        {review.tourist_name}
                      </div>

                      <div className="text-sm font-medium leading-6 text-slate-700">
                        {review.tour_name}
                      </div>

                      <div>
                        <RatingBadge rating={review.rating} />
                      </div>

                      <div className="text-sm font-medium leading-6 text-slate-700">
                        {review.comment}
                      </div>

                      <div className="text-sm font-medium text-emerald-800/80">
                        {review.formattedDate}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}