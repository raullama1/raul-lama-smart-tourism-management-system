// client/src/pages/public/PublicTourDetailsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const { tourId } = useParams();
  const navigate = useNavigate();

  const { token } = useAuth();
  const isAuthed = !!token;

  const [tour, setTour] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [busy, setBusy] = useState(false);

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

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10 text-center text-sm text-gray-500">
          Loading...
        </main>
        <Footer />
      </>
    );
  }

  if (!tour) {
    return (
      <>
        <Navbar />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10 text-center text-red-500 text-sm">
          Tour not found.
        </main>
        <Footer />
      </>
    );
  }

  const inWishlist = wishlistIds.has(Number(tourId));
  const bannerImg = toPublicImageUrl(tour.image_url);

  return (
    <>
      <Navbar />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl overflow-hidden shadow-sm"
          >
            <img
              src={bannerImg}
              alt={tour.title}
              className="w-full h-56 md:h-72 lg:h-80 object-cover transition-transform duration-700 hover:scale-[1.02]"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/1200x600?text=Tour+Image";
              }}
            />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                {tour.title}
              </h1>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border">
                  {tour.location}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border">
                  {tour.type}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={busy ? {} : { y: -1 }}
              whileTap={busy ? {} : { scale: 0.98 }}
              disabled={busy}
              onClick={toggleWishlist}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm border shadow transition-all ${
                inWishlist
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
              } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {inWishlist ? "✔ Added to Wishlist" : "♡ Add to Wishlist"}
            </motion.button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5"
          >
            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
              About this tour
            </h2>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {tour.long_description ||
                tour.description ||
                tour.short_description}
            </p>
          </motion.section>

          <motion.section
            id="agencies-section"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <h2 className="text-sm md:text-base font-semibold text-gray-900">
              All Agencies offering this Tour
            </h2>

            <TourAgenciesList agencies={agencies} onLoginAlert={requireLogin} />
          </motion.section>
        </div>
      </main>

      <Footer />
    </>
  );
}