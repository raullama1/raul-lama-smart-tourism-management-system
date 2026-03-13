// client/src/pages/public/PublicBlogsPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import BlogSidebarFilters from "../../components/public/BlogSidebarFilters";
import BlogListItem from "../../components/public/BlogListItem";
import { fetchPublicBlogs, fetchBlogComments } from "../../api/blogApi";
import { useAuth } from "../../context/AuthContext";

function normalizePreviewText(text, max = 140) {
  const clean = String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[•-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
}

export default function PublicBlogsPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const Navbar = isAuthenticated ? NavbarTourist : NavbarPublic;
  const Footer = isAuthenticated ? FooterTourist : FooterPublic;

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    sort: "latest",
    page: 1,
    limit: 6,
  });

  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);

  const [commentsByBlog, setCommentsByBlog] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);

  const [swapKey, setSwapKey] = useState(0);
  const firstLoadRef = useRef(true);

  const loadBlogs = useCallback(
    async ({ search, type, sort, page, limit, append, smoothSwap }) => {
      try {
        setLoading(true);

        const res = await fetchPublicBlogs({
          search,
          type,
          sort,
          page,
          limit,
        });

        if (!append && smoothSwap) {
          setSwapKey((prev) => prev + 1);
        }

        if (append) {
          setBlogs((prev) => [...prev, ...(res.data || [])]);
        } else {
          setBlogs(res.data || []);
        }

        setPagination(res.pagination || { total: 0, hasMore: false });
      } catch (err) {
        console.error("Failed to load blogs", err);
      } finally {
        setLoading(false);
        firstLoadRef.current = false;
      }
    },
    []
  );

  const loadCommentsPreview = useCallback(async (list) => {
    try {
      setLoadingComments(true);

      const results = await Promise.all(
        (list || []).map(async (b) => {
          try {
            const res = await fetchBlogComments(b.id, { page: 1, limit: 2 });
            return [
              b.id,
              {
                count: res.pagination?.total ?? (res.comments?.length || 0),
                items: res.comments || [],
              },
            ];
          } catch {
            return [b.id, { count: 0, items: [] }];
          }
        })
      );

      const nextComments = {};
      results.forEach(([id, payload]) => {
        nextComments[id] = payload;
      });

      setCommentsByBlog(nextComments);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    const smooth = !firstLoadRef.current;

    loadBlogs({
      search: filters.search,
      type: filters.type,
      sort: filters.sort,
      page: 1,
      limit: filters.limit,
      append: false,
      smoothSwap: smooth,
    });
  }, [filters.search, filters.type, filters.sort, filters.limit, loadBlogs]);

  useEffect(() => {
    if (blogs.length > 0) {
      loadCommentsPreview(blogs);
    } else {
      setCommentsByBlog({});
    }
  }, [blogs, loadCommentsPreview]);

  useEffect(() => {
    if (blogs.length > 0) {
      loadCommentsPreview(blogs);
    }
  }, [location.key, blogs.length, loadCommentsPreview, blogs]);

  const handleSidebarChange = (next) => {
    setFilters((prev) => ({
      ...prev,
      ...next,
      page: 1,
    }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      type: "",
      sort: "latest",
      page: 1,
      limit: 6,
    });
  };

  const handleLoadMore = async () => {
    if (!pagination.hasMore || loading) return;

    const nextPage = (filters.page || 1) + 1;

    setFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));

    await loadBlogs({
      search: filters.search,
      type: filters.type,
      sort: filters.sort,
      page: nextPage,
      limit: filters.limit,
      append: true,
      smoothSwap: false,
    });
  };

  const mappedBlogs = useMemo(() => {
    return blogs.map((b) => {
      const formattedDate = new Date(b.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const preview = commentsByBlog[b.id]?.items || [];
      const count = commentsByBlog[b.id]?.count || 0;

      return {
        ...b,
        formattedDate,
        excerpt: normalizePreviewText(b.content || b.excerpt, 180),
        commentCount: count,
        commentsPreview: preview,
      };
    });
  }, [blogs, commentsByBlog]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#edf7f1] pb-12 pt-6 md:pt-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
            <aside className="lg:w-[18rem] lg:flex-shrink-0">
              <div className="lg:sticky lg:top-28">
                <BlogSidebarFilters
                  filters={filters}
                  onChange={handleSidebarChange}
                  onReset={handleReset}
                />
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <div className="mb-4 flex flex-col gap-2 rounded-[1.6rem] border border-white/70 bg-white/75 px-4 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)] md:mb-5 md:flex-row md:items-center md:justify-between md:px-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 md:text-xl">
                    Blogs
                  </h2>
                  <p className="text-xs text-slate-500 md:text-sm">
                    {pagination.total || mappedBlogs.length} result
                    {(pagination.total || mappedBlogs.length) === 1 ? "" : "s"}
                  </p>
                </div>

                {loadingComments ? (
                  <div className="text-xs text-slate-500">Updating comments...</div>
                ) : null}
              </div>

              {loading && blogs.length === 0 ? (
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                  Loading blogs...
                </div>
              ) : mappedBlogs.length === 0 ? (
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                  No blogs found. Try different keywords or type.
                </div>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={swapKey}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-4"
                    >
                      {mappedBlogs.map((blog, index) => (
                        <motion.div
                          key={blog.id}
                          initial={{ opacity: 0, y: 22 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.15 }}
                          transition={{ duration: 0.42, delay: index * 0.04 }}
                        >
                          <BlogListItem blog={blog} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {pagination.hasMore && (
                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className={[
                          "inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:bg-slate-50",
                          loading ? "cursor-not-allowed opacity-60" : "",
                        ].join(" ")}
                        type="button"
                      >
                        {loading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}