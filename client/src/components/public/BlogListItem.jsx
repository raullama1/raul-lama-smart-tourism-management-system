// client/src/components/public/BlogListItem.jsx
import { useNavigate } from "react-router-dom";

export default function BlogListItem({ blog }) {
  const navigate = useNavigate();
  const sampleComments = blog.sampleComments || [];

  const handleReadMore = () => {
    navigate(`/blogs/${blog.id}`);
  };

  const handlePostComment = () => {
    alert("Please login or signup to post a comment.");
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

      {/* Read more */}
      <div className="mt-3">
        <button
          onClick={handleReadMore}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
        >
          Read More
        </button>
      </div>

      {/* Comments */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <h3 className="text-xs font-semibold text-gray-800 mb-2">Comments</h3>

        {/* Existing comments */}
        {sampleComments.length > 0 ? (
          <div className="max-h-32 overflow-y-auto space-y-2 pr-1 mb-2">
            {sampleComments.map((c, idx) => (
              <div
                key={idx}
                className="bg-[#e6f4ec] rounded-lg px-3 py-2 text-[11px]"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-gray-800">
                    {c.author}
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    {c.timeAgo}
                  </span>
                </div>
                <p className="text-gray-700">{c.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 mb-2">
            No comments yet. Be the first to share your thoughts.
          </p>
        )}

        {/* Write comment */}
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 h-8 rounded-md border border-gray-300 px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={handlePostComment}
            className="h-8 px-3 rounded-md bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700"
          >
            Post Comment
          </button>
        </div>
      </div>
    </article>
  );
}
