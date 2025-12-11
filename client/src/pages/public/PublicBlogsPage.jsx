// client/src/pages/public/PublicBlogsPage.jsx
import { useEffect, useState } from "react";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import BlogSidebarFilters from "../../components/public/BlogSidebarFilters";
import BlogListItem from "../../components/public/BlogListItem";
import { fetchPublicBlogs } from "../../api/blogApi";

export default function PublicBlogsPage() {
  const [filters, setFilters] = useState({
    search: "",
    sort: "",   // "" initially (nothing selected)
    page: 1,
    limit: 6,
  });

  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);

  const loadBlogs = async (overridePage) => {
    try {
      setLoading(true);

      const query = {
        ...filters,
        page: overridePage || filters.page,
      };

      const res = await fetchPublicBlogs(query); // { data, pagination }

      if (overridePage && overridePage > 1) {
        setBlogs((prev) => [...prev, ...res.data]);
      } else {
        setBlogs(res.data);
      }

      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load blogs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.sort]);

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

  const handleLoadMore = () => {
    if (!pagination.hasMore) return;
    const nextPage = (filters.page || 1) + 1;
    setFilters((prev) => ({ ...prev, page: nextPage }));
    loadBlogs(nextPage);
  };

  // Map date + attach sample comments for UI
  const mappedBlogs = blogs.map((b) => ({
    ...b,
    formattedDate: new Date(b.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    sampleComments:
      b.title === "Chitwan Jungle Safari Tips"
        ? [
            {
              author: "Raul Lama",
              timeAgo: "2h ago",
              text: "Morning drives gave us rhino sightings. Tharu cultural show at Sauraha was a highlight!",
            },
            {
              author: "John Smith",
              timeAgo: "1h ago",
              text: "Any tips for families traveling with kids in May heat?",
            },
          ]
        : b.title === "Top 5 Trekking Places in Nepal"
        ? [
            {
              author: "John Smith",
              timeAgo: "3h ago",
              text: "Great tips for choosing between EBC and Annapurna Circuit.",
            },
          ]
        : b.title === "Pokhara Travel Guide 2025"
        ? [
            {
              author: "John Smith",
              timeAgo: "5h ago",
              text: "Love the timing notes for Sarangkot. Lakeside cafes open early for coffee.",
            },
          ]
        : [],
  }));

  return (
    <>
      <NavbarPublic />
      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-4">
          {/* Left Sidebar */}
          <BlogSidebarFilters
            filters={filters}
            onChange={handleSidebarChange}
            onReset={handleReset}
          />

          {/* Blogs list */}
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
                {mappedBlogs.map((blog) => (
                  <BlogListItem key={blog.id} blog={blog} />
                ))}

                {pagination.hasMore && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-sm text-gray-800 hover:bg-gray-50"
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
      <FooterPublic />
    </>
  );
}
