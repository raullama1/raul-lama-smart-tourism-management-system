// client/src/components/public/BlogListItem.jsx
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

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
  const raw = String(value || "").trim();
  if (!raw) return FALLBACK_BLOG_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${SERVER_BASE_URL}${raw}`;
  return `${SERVER_BASE_URL}/${raw}`;
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
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-[240px] lg:w-[270px] shrink-0">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-[#eef8f2]">
            <img
              src={resolveImageUrl(blog.image_url)}
              alt={blog.title}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_BLOG_IMAGE;
              }}
              className="h-48 w-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm md:text-lg font-semibold text-gray-900">
                {blog.title}
              </h2>

              <div className="mt-1 text-xs md:text-sm text-gray-600">
                <div className="font-medium text-gray-800">
                  {blog.agency_name}
                </div>
                <div>{blog.formattedDate}</div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs md:text-sm text-gray-700 leading-relaxed">
            {cleanPreview(blog.content || blog.excerpt, 260)}
          </p>

          {blog.type ? (
            <div className="mt-4">
              <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {blog.type}
              </span>
            </div>
          ) : null}

          <div className="mt-5 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-800">Comments</h3>
              <span className="text-[11px] text-gray-500">
                {commentCount} comment{commentCount === 1 ? "" : "s"}
              </span>
            </div>

            {commentsPreview.length > 0 ? (
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {commentsPreview.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#e6f4ec] rounded-lg px-3 py-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className="font-medium text-gray-800">
                        {c.user_name || "User"}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(c.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">No comments yet.</p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleReadMore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
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
