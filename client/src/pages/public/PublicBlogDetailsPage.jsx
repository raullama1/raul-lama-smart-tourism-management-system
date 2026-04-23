// client/src/pages/public/PublicBlogDetailsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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

function makePreviewText(text, max = 140) {
  const clean = String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[•-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInlineMarkdown(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return safe;
}

function renderContentHtml(text) {
  const lines = String(text || "").split(/\r?\n/);
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push('<div class="h-4"></div>');
      continue;
    }

    const bulletMatch = line.match(/^(?:•|-)\s+(.*)$/);
    if (bulletMatch) {
      if (!inList) {
        html.push('<ul class="list-disc space-y-2 pl-5 text-slate-700">');
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(bulletMatch[1])}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(
      `<p class="leading-8 text-slate-700">${renderInlineMarkdown(line)}</p>`
    );
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
}

function AuthPopup({ open, onClose, onLogin, onSignup }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="relative w-full max-w-sm rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
      >
        <div className="text-base font-semibold text-slate-950">
          Login required
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Please login or signup to post a comment.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onLogin}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            type="button"
          >
            Login
          </button>
          <button
            onClick={onSignup}
            className="flex-1 rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            type="button"
          >
            Signup
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          type="button"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

export default function PublicBlogDetailsPage() {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();

  const Navbar = isAuthenticated ? NavbarTourist : NavbarPublic;
  const Footer = isAuthenticated ? FooterTourist : FooterPublic;
  const pageBg = isAuthenticated ? "#eef8f2" : "#edf7f1";

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

      setCommentPagination(
        res.pagination || { total: 0, page, limit: 6, hasMore: false }
      );
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

  const loadMoreComments = () => {
    if (!commentPagination.hasMore) return;
    loadCommentsPage((commentPagination.page || 1) + 1);
  };

  const mappedRecentBlogs = (recentBlogs || []).map((b) => ({
    id: b.id,
    title: b.title,
    excerpt: makePreviewText(b.content || b.excerpt, 140),
    agency: b.agency_name,
    image: b.image_url,
    type: b.type,
    date: new Date(b.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <div className="relative bg-[#071510]">
      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <Footer />
        </div>

        <div className="relative z-10" style={{ backgroundColor: pageBg }}>
          <Navbar />

          {loading ? (
            <main className="min-h-screen pb-12 pt-6">
              <div className="mx-auto max-w-6xl px-4 text-sm text-slate-500 md:px-6">
                Loading blog...
              </div>
            </main>
          ) : !blog ? (
            <main className="min-h-screen pb-12 pt-6">
              <div className="mx-auto max-w-6xl px-4 text-sm text-red-500 md:px-6">
                Blog not found.
              </div>
            </main>
          ) : (
            <main className="min-h-screen pb-12 pt-6 md:pt-8">
              <div className="mx-auto max-w-6xl space-y-6 px-4 md:px-6">
                <motion.section
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]"
                >
                  <div className="px-5 pb-5 pt-5 md:px-7 md:pb-7 md:pt-7">
                    <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 md:text-xs">
                      {blog.type || "Travel Blog"}
                    </div>

                    <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
                      {blog.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">
                        {blog.agency_name}
                      </span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <img
                      src={resolveImageUrl(blog.image_url)}
                      alt={blog.title}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_BLOG_IMAGE;
                      }}
                      className="h-64 w-full object-cover md:h-80 lg:h-[28rem]"
                    />
                  </div>

                  <div className="px-5 pb-6 pt-6 md:px-7 md:pb-8 md:pt-7">
                    <div
                      className="space-y-4 text-sm md:text-base"
                      dangerouslySetInnerHTML={{
                        __html: renderContentHtml(blog.content),
                      }}
                    />
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.16 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[1.8rem] border border-white/70 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] md:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950 md:text-lg">
                      Comments
                    </h2>
                    <span className="text-xs text-slate-500">
                      {commentPagination.total} total
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[46px] flex-1 rounded-xl border border-emerald-100 bg-[#eef8f2] px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={posting || !commentText.trim()}
                      className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                    >
                      {posting ? "Posting..." : "Post Comment"}
                    </button>
                  </div>

                  {loadingComments ? (
                    <div className="mt-4 text-sm text-slate-500">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="mt-4 text-sm text-slate-500">
                      No comments yet.
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 space-y-3">
                        {comments.map((c, index) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.32, delay: index * 0.03 }}
                            className="rounded-2xl border border-emerald-100 bg-[#eef8f2] px-4 py-3"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-800">
                                {c.user_name || "User"}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">
                                  {new Date(c.created_at).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </span>

                                {canDelete(c) && (
                                  <button
                                    onClick={() => handleDelete(c.id)}
                                    disabled={deletingId === c.id}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-white disabled:opacity-60"
                                    type="button"
                                  >
                                    {deletingId === c.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                              {c.comment}
                            </p>
                          </motion.div>
                        ))}
                      </div>

                      {commentPagination.hasMore && (
                        <div className="flex justify-center pt-4">
                          <button
                            onClick={loadMoreComments}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                            type="button"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.section>

                {mappedRecentBlogs.length > 0 && (
                  <section className="-mx-4 md:-mx-6">
                    <BlogCardSection
                      blogs={mappedRecentBlogs}
                      sectionTitle="Recent Blogs"
                      viewAllLink="/blogs"
                    />
                  </section>
                )}
              </div>
            </main>
          )}

          <AuthPopup
            open={showAuthPopup}
            onClose={() => setShowAuthPopup(false)}
            onLogin={() => navigate("/login")}
            onSignup={() => navigate("/signup")}
          />
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>
    </div>
  );
}