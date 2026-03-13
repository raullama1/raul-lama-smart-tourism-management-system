// client/src/components/shared/HomeContent.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import HeroSection from "../public/HeroSection";
import TourCard from "../public/TourCard";
import { BlogCardSection } from "../public/BlogCard";
import {
  fetchPublicHomeData,
  fetchTourRecommendations,
} from "../../api/homeApi";
import { useAuth } from "../../context/AuthContext";

export default function HomeContent({ mode = "public" }) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [popularTours, setPopularTours] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationRefreshKey, setRecommendationRefreshKey] = useState(0);

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

  const loadRecommendations = useCallback(async () => {
    if (mode !== "tourist" || authLoading || !isAuthenticated) {
      setRecommendedTours([]);
      return;
    }

    try {
      setRecommendationLoading(true);
      const data = await fetchTourRecommendations();
      setRecommendedTours(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load recommendations", err);
      setRecommendedTours([]);
    } finally {
      setRecommendationLoading(false);
    }
  }, [mode, authLoading, isAuthenticated]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations, recommendationRefreshKey]);

  const handleRecommendationRefresh = useCallback(() => {
    setRecommendationRefreshKey((prev) => prev + 1);
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

  const mappedTours = useMemo(
    () =>
      popularTours.map((t) => ({
        id: t.id,
        title: t.title,
        name: t.title,
        location: t.location,
        type: t.type,
        price: t.starting_price,
        starting_price: t.starting_price,
        image: t.image_url,
        image_url: t.image_url,
      })),
    [popularTours]
  );

  const mappedRecommendedTours = useMemo(
    () =>
      recommendedTours.map((t) => ({
        id: t.id,
        title: t.title,
        name: t.title,
        location: t.location,
        type: t.type,
        price: t.starting_price,
        starting_price: t.starting_price,
        image: t.image_url,
        image_url: t.image_url,
      })),
    [recommendedTours]
  );

  const mappedBlogs = useMemo(
    () =>
      latestBlogs.map((b) => ({
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
      })),
    [latestBlogs]
  );

  const shouldShowRecommendations =
    mode === "tourist" &&
    isAuthenticated &&
    !authLoading &&
    mappedRecommendedTours.length > 0;

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
            sectionTitle="Popular Tours"
            onRequireLogin={handleRequireLogin}
            onWishlistChanged={handleRecommendationRefresh}
          />

          {mode === "tourist" && isAuthenticated && !authLoading && recommendationLoading ? (
            <section className="bg-[#e6f4ec] py-2 md:py-3">
              <div className="max-w-6xl mx-auto px-4 md:px-6 text-sm text-gray-500">
                Loading recommendations...
              </div>
            </section>
          ) : null}

          {shouldShowRecommendations ? (
            <TourCard
              tours={mappedRecommendedTours}
              showSectionHeader={true}
              sectionTitle="Recommended For You"
              onRequireLogin={handleRequireLogin}
              onWishlistChanged={handleRecommendationRefresh}
            />
          ) : null}

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