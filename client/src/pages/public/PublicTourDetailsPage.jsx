import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

  // Load tour + agencies
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

  // Load wishlist ids
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

  // Smooth scroll to agencies
  useEffect(() => {
    if (!tour) return;

    if (window.location.hash === "#agencies") {
      setTimeout(() => {
        const el = document.getElementById("agencies-section");
        if (el) {
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

  return (
    <>
      <Navbar />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
          {/* Banner */}
          <section className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <img
              src={tour.image_url}
              alt={tour.title}
              className="w-full h-56 md:h-72 lg:h-80 object-cover"
            />
          </section>

          {/* Title */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

            {/* Wishlist Toggle */}
            <button
              disabled={busy}
              onClick={toggleWishlist}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm border shadow transition-all
                ${
                  inWishlist
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }
                ${busy ? "opacity-60 cursor-not-allowed" : ""}
              `}
            >
              {inWishlist ? "✔ Added to Wishlist" : "♡ Add to Wishlist"}
            </button>
          </section>

          {/* About */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
              About this tour
            </h2>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {tour.long_description || tour.description || tour.short_description}
            </p>
          </section>

          {/* Agencies */}
          <section id="agencies-section" className="space-y-3">
            <h2 className="text-sm md:text-base font-semibold text-gray-900">
              All Agencies offering this Tour
            </h2>

            <TourAgenciesList
              agencies={agencies}
              onLoginAlert={requireLogin}
            />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
