// client/src/components/shared/HomeContent.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiLock, FiX } from "react-icons/fi";
import HeroSection from "../public/HeroSection";
import TourCard from "../public/TourCard";
import { BlogCardSection } from "../public/BlogCard";
import {
  fetchPublicHomeData,
  fetchTourRecommendations,
} from "../../api/homeApi";
import { useAuth } from "../../context/AuthContext";

const sectionFadeUp = {
  hidden: { opacity: 0, y: 48, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HomeContent({ mode = "public" }) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [popularTours, setPopularTours] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]);
  const [loginPrompt, setLoginPrompt] = useState({
    open: false,
    message: "",
  });

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

  const showLoginPrompt = useCallback((message) => {
    setLoginPrompt({
      open: true,
      message,
    });
  }, []);

  const closeLoginPrompt = useCallback(() => {
    setLoginPrompt((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  useEffect(() => {
    if (!loginPrompt.open) return undefined;

    const timer = window.setTimeout(() => {
      setLoginPrompt((prev) => ({
        ...prev,
        open: false,
      }));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [loginPrompt.open, loginPrompt.message]);

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

  const handleRequireLogin = useCallback(() => {
    if (mode === "public") {
      showLoginPrompt("Please login or signup to use this feature.");
      return false;
    }

    return true;
  }, [mode, showLoginPrompt]);

  const handleDiscoverTours = useCallback(() => {
    return true;
  }, []);

  const handleDiscoverMap = useCallback(() => {
    if (mode === "public") {
      showLoginPrompt("Please login or signup to discover tours on the Nepal map.");
      return false;
    }

    return true;
  }, [mode, showLoginPrompt]);

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
    <main className="relative overflow-hidden bg-[#eef8f2]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-24 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl md:h-72 md:w-72" />
        <div className="absolute right-[-6rem] top-[32rem] h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl md:h-80 md:w-80" />
        <div className="absolute bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <AnimatePresence>
        {loginPrompt.open ? (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed right-4 top-20 z-[90] w-[calc(100%-2rem)] max-w-sm md:right-6 md:top-24"
          >
            <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <FiLock className="text-[18px]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Login required
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {loginPrompt.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeLoginPrompt}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <FiX className="text-base" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <HeroSection
        onDiscoverToursClick={handleDiscoverTours}
        onDiscoverMapClick={handleDiscoverMap}
      />

      {loading ? (
        <section className="relative py-10 md:py-14">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 md:px-6">
            Loading tours and blogs...
          </div>
        </section>
      ) : (
        <>
          <motion.div
            variants={sectionFadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
          >
            <TourCard
              tours={mappedTours}
              showSectionHeader={true}
              sectionTitle="Popular Tours"
              onRequireLogin={handleRequireLogin}
              onWishlistChanged={handleRecommendationRefresh}
            />
          </motion.div>

          {mode === "tourist" &&
          isAuthenticated &&
          !authLoading &&
          recommendationLoading ? (
            <section className="relative py-2 md:py-4">
              <div className="mx-auto max-w-6xl px-4 text-sm text-gray-500 md:px-6">
                Loading recommendations...
              </div>
            </section>
          ) : null}

          {shouldShowRecommendations ? (
            <motion.div
              variants={sectionFadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.18 }}
            >
              <TourCard
                tours={mappedRecommendedTours}
                showSectionHeader={true}
                sectionTitle="Recommended For You"
                onRequireLogin={handleRequireLogin}
                onWishlistChanged={handleRecommendationRefresh}
              />
            </motion.div>
          ) : null}

          <motion.div
            variants={sectionFadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.16 }}
          >
            <BlogCardSection
              blogs={mappedBlogs}
              sectionTitle="Latest Blogs"
              viewAllLink="/blogs"
            />
          </motion.div>
        </>
      )}
    </main>
  );
}