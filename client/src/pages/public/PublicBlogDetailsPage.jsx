// client/src/pages/public/PublicBlogDetailsPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import { BlogCardSection } from "../../components/public/BlogCard";
import { fetchPublicBlogDetails } from "../../api/blogApi";

export default function PublicBlogDetailsPage() {
  const { blogId } = useParams();
  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleLoginClick = () => {
    alert("Please login or signup to post a comment.");
  };

  if (loading) {
    return (
      <>
        <NavbarPublic />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-sm text-gray-500">
            Loading blog...
          </div>
        </main>
        <FooterPublic />
      </>
    );
  }

  if (!blog) {
    return (
      <>
        <NavbarPublic />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-sm text-red-500">
            Blog not found.
          </div>
        </main>
        <FooterPublic />
      </>
    );
  }

  const formattedDate = new Date(blog.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const tagMap = {
    "Chitwan Jungle Safari Tips": ["Nepal", "Chitwan", "Safari", "Tharu Culture"],
    "Lumbini Buddhist Heritage Tour": ["Lumbini", "Buddhist", "Heritage"],
    "Top 5 Trekking Places in Nepal": ["Nepal", "Trekking", "Himalaya"],
    "Pokhara Travel Guide 2025": ["Pokhara", "Travel", "Adventure"],
  };
  const tags = tagMap[blog.title] || [];

  const baseComments = {
    "Chitwan Jungle Safari Tips": [
      { meta: "Jestha 5, 2025", text: "Morning drives gave us reliable rhino sightings near Tamor Tal. Families should carry ORS and caps." },
      { meta: "Jestha 4, 2025", text: "Any recommendation for canoe timings on Rapti to spot gharials safely?" },
      { meta: "Jestha 3, 2025", text: "Tharu cultural show at Sauraha community hall is authentic and supports locals. Book same-day." },
    ],
    "Lumbini Buddhist Heritage Tour": [
      { meta: "Baisakh 20, 2025", text: "Early morning around Maya Devi Temple is the most peaceful time." },
    ],
    "Top 5 Trekking Places in Nepal": [
      { meta: "Baisakh 12, 2025", text: "Nice overview. Would love a separate article on Manaslu logistics." },
    ],
    "Pokhara Travel Guide 2025": [
      { meta: "Baisakh 18, 2025", text: "We agree about sunrise at Sarangkot. Great photography tips!" },
    ],
  };

  const comments = (baseComments[blog.title] || []).map((c, idx) => ({
    author: idx % 2 === 0 ? "Raul Lama" : "John Smith",
    meta: c.meta,
    text: c.text,
  }));

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

  return (
    <>
      <NavbarPublic />
      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">

          {/* Blog Title + Meta */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">{blog.title}</h1>

            <div className="mt-1 text-xs md:text-sm text-gray-600">
              <div className="font-medium">{blog.agency_name}</div>
              <div>{formattedDate} • 7 min read</div>
            </div>

            {/* Cover image */}
            <div className="mt-4 rounded-2xl overflow-hidden">
              <img src={blog.image_url} alt={blog.title} className="w-full h-56 md:h-72 lg:h-80 object-cover" />
            </div>

            {/* Full content */}
            <p className="mt-4 text-xs md:text-sm text-gray-800 leading-relaxed whitespace-pre-line">{blog.content}</p>

            {/* Tags */}
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

          {/* Comments */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 space-y-3">
            <h2 className="text-sm md:text-base font-semibold text-gray-900">Comments</h2>

            {/* Input + Button in one line */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 bg-[#e6f4ec] rounded-lg px-3 py-2 text-xs text-gray-700 border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleLoginClick}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-white text-xs md:text-sm font-medium hover:bg-emerald-700"
              >
                Post Comment
              </button>
            </div>

            {/* All comments shown, no scrolling */}
            {comments.length > 0 && (
              <div className="mt-2 space-y-2 pr-1">
                {comments.map((c, idx) => (
                  <div key={idx} className="bg-[#e6f4ec] rounded-lg px-3 py-2 text-[11px]">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-gray-800">{c.author}</span>
                      <span className="text-gray-500 text-[10px]">{c.meta}</span>
                    </div>
                    <p className="text-gray-800">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Blogs */}
          {mappedRecentBlogs.length > 0 && (
            <section className="bg-[#e6f4ec] -mx-4 md:-mx-6">
              <BlogCardSection blogs={mappedRecentBlogs} sectionTitle="Recent Blogs" viewAllLink="/blogs" />
            </section>
          )}
        </div>
      </main>
      <FooterPublic />
    </>
  );
}
