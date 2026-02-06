// client/src/components/public/BlogListItem.jsx
import { useNavigate } from "react-router-dom";

export default function BlogListItem({ blog }) {
  const navigate = useNavigate();

  const commentsPreview = blog.commentsPreview || [];
  const commentCount = Number(blog.commentCount || 0);

  const handleReadMore = () => {
    navigate(`/blogs/${blog.id}`);
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 mb-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            {blog.title}
          </h2>
          <p className="mt-1 text-xs text-gray-600 line-clamp-2 md:line-clamp-none">
            {blog.excerpt}
          </p>
        </div>

        <div className="text-right text-[11px] text-gray-500">
          <div className="font-medium text-gray-800">{blog.agency_name}</div>
          <div>{blog.formattedDate}</div>
        </div>
      </div>

      {/* Comments preview */}
      <div className="mt-4 border-t border-gray-100 pt-3">
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
          <p className="text-[11px] text-gray-400">
            No comments yet.
          </p>
        )}
      </div>

      {/* Read more (at bottom – single CTA) */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReadMore}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
          type="button"
        >
          Read More
        </button>
      </div>
    </article>
  );
}
