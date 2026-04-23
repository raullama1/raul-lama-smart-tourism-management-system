// client/src/components/public/BlogListItem.jsx
import { useNavigate } from "react-router-dom";
import { toPublicImageUrl } from "../../utils/publicImageUrl";

const FALLBACK_BLOG_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <rect width="1200" height="700" fill="#dff3e7"/>
      <rect x="80" y="80" width="1040" height="540" rx="28" fill="#c8ead5"/>
      <circle cx="260" cy="230" r="56" fill="#9fd3b2"/>
      <path d="M170 500l170-170 120 115 155-165 225 220H170z" fill="#77b790"/>
      <text x="600" y="610" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#2f6f53">
        Smart Tourism Blog
      </text>
    </svg>
  `);

function resolveImageUrl(value) {
  return toPublicImageUrl(value) || FALLBACK_BLOG_IMAGE;
}

function cleanPreview(text, max = 220) {
  const clean = String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[•-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
}

export default function BlogListItem({ blog }) {
  const navigate = useNavigate();

  const commentsPreview = blog.commentsPreview || [];
  const commentCount = Number(blog.commentCount || 0);

  const handleReadMore = () => {
    navigate(`/blogs/${blog.id}`);
  };

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
        <div className="w-full shrink-0 lg:w-[260px] xl:w-[290px]">
          <div className="overflow-hidden rounded-[1.4rem] bg-[#eef8f2]">
            <img
              src={resolveImageUrl(blog.image_url)}
              alt={blog.title}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_BLOG_IMAGE;
              }}
              className="h-52 w-full object-cover transition-transform duration-500 hover:scale-[1.04] lg:h-full lg:min-h-[260px]"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950 md:text-2xl">
                {blog.title}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 md:text-sm">
                <span className="font-medium text-slate-700">{blog.agency_name}</span>
                <span>{blog.formattedDate}</span>
              </div>
            </div>

            {blog.type ? (
              <div className="shrink-0">
                <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  {blog.type}
                </span>
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-700 md:text-[15px]">
            {cleanPreview(blog.content || blog.excerpt, 260)}
          </p>

          <div className="mt-5 rounded-[1.25rem] border border-emerald-100 bg-[#f3fbf6] p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-800">
                Comments
              </h3>
              <span className="text-[11px] text-slate-500">
                {commentCount} comment{commentCount === 1 ? "" : "s"}
              </span>
            </div>

            {commentsPreview.length > 0 ? (
              <div className="space-y-2">
                {commentsPreview.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-emerald-100 bg-white px-3 py-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-slate-800">
                        {c.user_name || "User"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[12px] leading-5 text-slate-700">
                      {c.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">No comments yet.</p>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleReadMore}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700"
              type="button"
            >
              Read More
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}