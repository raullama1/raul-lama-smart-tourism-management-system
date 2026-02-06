// client/src/pages/public/PublicBlogsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import BlogSidebarFilters from "../../components/public/BlogSidebarFilters";
import BlogListItem from "../../components/public/BlogListItem";
import { fetchPublicBlogs, fetchBlogComments } from "../../api/blogApi";
import { useAuth } from "../../context/AuthContext";

function makePreviewText(text, max = 140) {
  if (!text) return "";

  const firstLine = String(text).split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const clean = firstLine.replace(/\s+/g, " ").trim();

  if (clean.length <= max) return clean;
  return clean.slice(0, max).trim() + "...";
}

export default function PublicBlogsPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const Navbar = isAuthenticated ? NavbarTourist : NavbarPublic;
  const Footer = isAuthenticated ? FooterTourist : FooterPublic;

  const [filters, setFilters] = useState({
    search: "",
    sort: "",
    page: 1,
    limit: 6,
  });

  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);

  const [commentsByBlog, setCommentsByBlog] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);

  const loadBlogs = async ({ page, append }) => {
    try {
      setLoading(true);

      const res = await fetchPublicBlogs({
        ...filters,
        page,
      });

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
    }
  };

  const loadCommentsPreview = async (list) => {
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

      const obj = {};
      results.forEach(([id, payload]) => (obj[id] = payload));
      setCommentsByBlog(obj);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadBlogs({ page: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.sort]);

  useEffect(() => {
    if (blogs.length > 0) loadCommentsPreview(blogs);
    else setCommentsByBlog({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogs]);

  useEffect(() => {
    if (blogs.length > 0) loadCommentsPreview(blogs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const handleSidebarChange = (next) => {
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      sort: "",
      page: 1,
      limit: 6,
    });
  };

  const handleLoadMore = async () => {
    if (!pagination.hasMore) return;

    const nextPage = (filters.page || 1) + 1;

    setFilters((prev) => ({ ...prev, page: nextPage }));
    await loadBlogs({ page: nextPage, append: true });
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
        // ✅ force list preview to match full blog text
        excerpt: makePreviewText(b.content || b.excerpt, 140),
        commentCount: count,
        commentsPreview: preview,
      };
    });
  }, [blogs, commentsByBlog]);

  return (
    <>
      <Navbar />
      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-4">
          <BlogSidebarFilters
            filters={filters}
            onChange={handleSidebarChange}
            onReset={handleReset}
          />

          <section className="flex-1">
            <header className="mb-4">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Blogs
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                Discover travel stories, guides, and tips from local agencies.
              </p>
            </header>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
                Loading blogs...
              </div>
            ) : mappedBlogs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
                No blogs found. Try different keywords.
              </div>
            ) : (
              <>
                {loadingComments && (
                  <div className="mb-2 text-xs text-gray-500">
                    Updating comments...
                  </div>
                )}

                {mappedBlogs.map((blog) => (
                  <BlogListItem
                    key={blog.id}
                    blog={blog}
                    isAuthenticated={isAuthenticated}
                  />
                ))}

                {pagination.hasMore && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleLoadMore}
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
        </div>
      </main>
      <Footer />
    </>
  );
}
