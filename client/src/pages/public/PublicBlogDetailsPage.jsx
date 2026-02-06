import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { BlogCardSection } from "../../components/public/BlogCard";
import {
  fetchPublicBlogDetails,
  fetchBlogComments,
  postBlogComment,
  deleteBlogComment,
} from "../../api/blogApi";
import { useAuth } from "../../context/AuthContext";

function AuthPopup({ open, onClose, onLogin, onSignup }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl border border-gray-100 p-5">
        <div className="text-base font-semibold text-gray-900">Login required</div>
        <p className="mt-1 text-sm text-gray-600">
          Please login or signup to post a comment.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onLogin}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Login
          </button>
          <button
            onClick={onSignup}
            className="flex-1 rounded-xl border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Signup
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PublicBlogDetailsPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();

  const Navbar = isAuthenticated ? NavbarTourist : NavbarPublic;
  const Footer = isAuthenticated ? FooterTourist : FooterPublic;

  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState([]);
  const [commentPagination, setCommentPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    hasMore: false,
  });
  const [loadingComments, setLoadingComments] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const formattedDate = useMemo(() => {
    if (!blog?.created_at) return "";
    return new Date(blog.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [blog]);

  useEffect(() => {
    async function loadBlog() {
      try {
        setLoading(true);
        const data = await fetchPublicBlogDetails(blogId);
        setBlog(data.blog || null);
        setRecentBlogs(data.recentBlogs || []);
      } catch (err) {
        console.error("Failed to load blog details", err);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [blogId]);

  const loadCommentsPage = async (page) => {
    try {
      setLoadingComments(true);
      const res = await fetchBlogComments(blogId, { page, limit: 6 });

      if (page > 1) {
        setComments((prev) => [...prev, ...(res.comments || [])]);
      } else {
        setComments(res.comments || []);
      }

      setCommentPagination(res.pagination || { total: 0, page, limit: 6, hasMore: false });
    } catch (err) {
      console.error("Failed to load comments", err);
      setComments([]);
      setCommentPagination({ total: 0, page: 1, limit: 6, hasMore: false });
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadCommentsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  const handlePostComment = async () => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }

    const text = commentText.trim();
    if (!text) return;

    try {
      setPosting(true);
      await postBlogComment(blogId, text, token);
      setCommentText("");
      await loadCommentsPage(1);
    } catch (err) {
      console.error("Failed to post comment", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const canDelete = (c) => {
    if (!isAuthenticated) return false;
    return Number(c.user_id) === Number(user?.id);
  };

  const handleDelete = async (commentId) => {
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }

    try {
      setDeletingId(commentId);
      await deleteBlogComment(blogId, commentId, token);
      await loadCommentsPage(1);
    } catch (err) {
      console.error("Failed to delete comment", err);
      alert("Failed to delete comment.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-sm text-gray-500">
            Loading blog...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!blog) {
    return (
      <>
        <Navbar />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-sm text-red-500">
            Blog not found.
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const tagMap = {
    "Chitwan Jungle Safari Tips": ["Nepal", "Chitwan", "Safari", "Tharu Culture"],
    "Lumbini Buddhist Heritage Tour": ["Lumbini", "Buddhist", "Heritage"],
    "Top 5 Trekking Places in Nepal": ["Nepal", "Trekking", "Himalaya"],
    "Pokhara Travel Guide 2025": ["Pokhara", "Travel", "Adventure"],
  };
  const tags = tagMap[blog.title] || [];

  const mappedRecentBlogs = recentBlogs.map((b) => ({
    id: b.id,
    title: b.title,
    excerpt: b.excerpt,
    agency: b.agency_name,
    image: b.image_url,
    date: new Date(b.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  const loadMoreComments = () => {
    if (!commentPagination.hasMore) return;
    loadCommentsPage((commentPagination.page || 1) + 1);
  };

  return (
    <>
      <Navbar />
      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">{blog.title}</h1>

            <div className="mt-1 text-xs md:text-sm text-gray-600">
              <div className="font-medium">{blog.agency_name}</div>
              <div>{formattedDate} • 7 min read</div>
            </div>

            <div className="mt-4 rounded-2xl overflow-hidden">
              <img
                src={blog.image_url}
                alt={blog.title}
                className="w-full h-56 md:h-72 lg:h-80 object-cover"
              />
            </div>

            <p className="mt-4 text-xs md:text-sm text-gray-800 leading-relaxed whitespace-pre-line">
              {blog.content}
            </p>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-semibold text-gray-900">Comments</h2>
              <span className="text-xs text-gray-500">{commentPagination.total} total</span>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-[#e6f4ec] rounded-lg px-3 py-2 text-xs text-gray-700 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handlePostComment}
                disabled={posting || !commentText.trim()}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-white text-xs md:text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {posting ? "Posting..." : "Post Comment"}
              </button>
            </div>

            {loadingComments ? (
              <div className="text-xs text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-xs text-gray-500">No comments yet.</div>
            ) : (
              <>
                <div className="mt-2 space-y-2 pr-1">
                  {comments.map((c) => (
                    <div key={c.id} className="bg-[#e6f4ec] rounded-lg px-3 py-2 text-[11px]">
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <span className="font-medium text-gray-800">{c.user_name || "User"}</span>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-[10px]">
                            {new Date(c.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>

                          {canDelete(c) && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="text-[10px] px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-60"
                              type="button"
                            >
                              {deletingId === c.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-800 whitespace-pre-line">{c.comment}</p>
                    </div>
                  ))}
                </div>

                {commentPagination.hasMore && (
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={loadMoreComments}
                      className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-sm text-gray-800 hover:bg-gray-50"
                      type="button"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {mappedRecentBlogs.length > 0 && (
            <section className="bg-[#e6f4ec] -mx-4 md:-mx-6">
              <BlogCardSection blogs={mappedRecentBlogs} sectionTitle="Recent Blogs" viewAllLink="/blogs" />
            </section>
          )}
        </div>
      </main>
      <Footer />

      <AuthPopup
        open={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
      />
    </>
  );
}
