// client/src/pages/public/PublicTourDetailsPage.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import TourAgenciesList from "../../components/public/TourAgenciesList";
import { fetchPublicTourDetails } from "../../api/tourApi";
import { useAuth } from "../../context/AuthContext";
import {
  fetchWishlistIds,
  addToWishlist,
  removeFromWishlist,
} from "../../api/wishlistApi";

const API_ORIGIN = "http://localhost:5001";

function toPublicImageUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
}

export default function PublicTourDetailsPage() {
  const { token } = useAuth();
  const isAuthed = !!token;

  const [tour, setTour] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const tourId = window.location.pathname.split("/").pop();

  const requireLogin = () => {
    if (!isAuthed) {
      alert("Please login or signup to access this feature.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const res = await fetchPublicTourDetails(tourId);
        setTour(res.tour);
        setAgencies(res.agencies || []);
      } catch (err) {
        console.error("Failed to load tour details", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [tourId]);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!token) {
        setWishlistIds(new Set());
        return;
      }
      try {
        const res = await fetchWishlistIds(token);
        setWishlistIds(new Set(res?.data || []));
      } catch (e) {
        console.error("Failed to load wishlist ids", e);
      }
    };
    loadWishlist();
  }, [token]);

  useEffect(() => {
    if (!tour) return;

    if (window.location.hash === "#agencies") {
      setTimeout(() => {
        const el = document.getElementById("agencies-section");
        if (el) {
          if (window.__lenis) {
            window.__lenis.scrollTo(el, { offset: -80, duration: 1 });
            return;
          }

          const rect = el.getBoundingClientRect();
          window.scrollTo({
            top: rect.top + window.scrollY - 80,
            behavior: "smooth",
          });
        }
      }, 300);
    }
  }, [tour]);

  const toggleWishlist = async () => {
    if (!requireLogin()) return;

    const id = Number(tourId);
    const already = wishlistIds.has(id);

    try {
      setBusy(true);

      if (already) {
        await removeFromWishlist(token, id);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await addToWishlist(token, id);
        setWishlistIds((prev) => new Set(prev).add(id));
      }
    } catch (e) {
      console.error("Wishlist toggle failed", e);
      alert("Wishlist update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const Navbar = isAuthed ? NavbarTourist : NavbarPublic;
  const Footer = isAuthed ? FooterTourist : FooterPublic;
  const pageBg = isAuthed ? "#eef8f2" : "#e6f4ec";

  return (
    <div className="relative bg-[#071510]">
      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <Footer />
        </div>

        <div className="relative z-10" style={{ backgroundColor: pageBg }}>
          <Navbar />

          {loading ? (
            <main className="min-h-screen pt-6 pb-10 text-center text-sm text-gray-500">
              Loading...
            </main>
          ) : !tour ? (
            <main className="min-h-screen pt-6 pb-10 text-center text-sm text-red-500">
              Tour not found.
            </main>
          ) : (
            <main className="min-h-screen pt-6 pb-10">
              <div className="mx-auto max-w-6xl space-y-6 px-4 md:px-6">
                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm"
                >
                  <img
                    src={toPublicImageUrl(tour.image_url)}
                    alt={tour.title}
                    className="h-56 w-full object-cover transition-transform duration-700 hover:scale-[1.02] md:h-72 lg:h-80"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/1200x600?text=Tour+Image";
                    }}
                  />
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
                      {tour.title}
                    </h1>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border bg-emerald-50 px-3 py-1 text-emerald-700">
                        {tour.location}
                      </span>
                      <span className="rounded-full border bg-emerald-50 px-3 py-1 text-emerald-700">
                        {tour.type}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={busy ? {} : { y: -1 }}
                    whileTap={busy ? {} : { scale: 0.98 }}
                    disabled={busy}
                    onClick={toggleWishlist}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs shadow transition-all md:text-sm ${
                      wishlistIds.has(Number(tourId))
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                    } ${busy ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {wishlistIds.has(Number(tourId))
                      ? "✔ Added to Wishlist"
                      : "♡ Add to Wishlist"}
                  </motion.button>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5"
                >
                  <h2 className="mb-2 text-sm font-semibold text-gray-900 md:text-base">
                    About this tour
                  </h2>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-gray-700 md:text-sm">
                    {tour.long_description ||
                      tour.description ||
                      tour.short_description}
                  </p>
                </motion.section>

                <motion.section
                  id="agencies-section"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="space-y-3"
                >
                  <h2 className="text-sm font-semibold text-gray-900 md:text-base">
                    All Agencies offering this Tour
                  </h2>

                  <TourAgenciesList agencies={agencies} onLoginAlert={requireLogin} />
                </motion.section>
              </div>
            </main>
          )}
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>
    </div>
  );
}