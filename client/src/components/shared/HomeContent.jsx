import { useEffect, useState } from "react";
import HeroSection from "../public/HeroSection";
import TourCard from "../public/TourCard";
import { BlogCardSection } from "../public/BlogCard";
import { fetchPublicHomeData } from "../../api/homeApi";

export default function HomeContent({ mode = "public" }) {
  const [popularTours, setPopularTours] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        setLoading(true);
        const data = await fetchPublicHomeData();
        setPopularTours(data.popularTours || []);
        setLatestBlogs(data.latestBlogs || []);
      } catch (err) {
        console.error("Failed to load home page data", err);
      } finally {
        setLoading(false);
      }
    }
    loadHome();
  }, []);

  const handleRequireLogin = () => {
    if (mode === "public") {
      alert("Please login or signup to access this feature.");
    }
  };

  const handleDiscoverTours = () => {
    if (mode === "public") {
      alert("Please login or signup to access this feature.");
    }
  };

  const mappedTours = popularTours.map((t) => ({
    id: t.id,
    name: t.title,
    location: t.location,
    type: t.type,
    price: t.starting_price,
    image: t.image_url,
  }));

  const mappedBlogs = latestBlogs.map((b) => ({
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
      <HeroSection onDiscoverToursClick={handleDiscoverTours} />

      {loading ? (
        <section className="bg-[#e6f4ec] py-10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-gray-500">
            Loading tours and blogs...
          </div>
        </section>
      ) : (
        <>
          <TourCard
            tours={mappedTours}
            showSectionHeader={true}
            onRequireLogin={handleRequireLogin}
          />

          <BlogCardSection
            blogs={mappedBlogs}
            sectionTitle="Latest Blogs"
            viewAllLink="/blogs"
          />
        </>
      )}
    </>
  );
}
