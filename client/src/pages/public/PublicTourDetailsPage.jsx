import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";

import TourAgenciesList from "../../components/public/TourAgenciesList";
import { fetchPublicTourDetails } from "../../api/tourApi";
import { useAuth } from "../../context/AuthContext";

export default function PublicTourDetailsPage() {
  const { tourId } = useParams();
  const navigate = useNavigate();

  const { token } = useAuth();
  const isAuthed = !!token;

  const [tour, setTour] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const requireLoginOrGoTours = () => {
    if (isAuthed) {
      navigate("/tours"); // ✅ for now (until wishlist/map pages are built)
      return;
    }
    alert("Please login or signup to access this feature.");
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

  // ✅ Smooth scroll to agencies section if URL has #agencies
  useEffect(() => {
    if (!tour) return;

    if (window.location.hash === "#agencies") {
      setTimeout(() => {
        const el = document.getElementById("agencies-section");
        if (el) {
          const rect = el.getBoundingClientRect();
          const offsetTop = rect.top + window.scrollY - 80;
          window.scrollTo({ top: offsetTop, behavior: "smooth" });
        }
      }, 300);
    }
  }, [tour]);

  const Navbar = isAuthed ? NavbarTourist : NavbarPublic;
  const Footer = isAuthed ? FooterTourist : FooterPublic;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
          <div className="text-center text-sm text-gray-500">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!tour) {
    return (
      <>
        <Navbar />
        <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
          <div className="text-center text-red-500 text-sm">Tour not found.</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
          {/* Banner Image */}
          <section className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <img
              src={tour.image_url}
              alt={tour.title}
              className="w-full h-56 md:h-72 lg:h-80 object-cover"
            />
          </section>

          {/* Title & Tags */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                {tour.title}
              </h1>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {tour.location}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {tour.type}
                </span>
              </div>
            </div>

            {/* Wishlist button becomes redirect for logged-in */}
            <button
              onClick={requireLoginOrGoTours}
              className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-xs md:text-sm text-gray-800 hover:bg-gray-50"
            >
              ♡ Add to Wishlist
            </button>
          </section>

          {/* About Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
              About this tour
            </h2>

            <p className="text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {tour.long_description || tour.description || tour.short_description}
            </p>
          </section>

          {/* Agencies Section */}
          <section id="agencies-section" className="space-y-3">
            <h2 className="text-sm md:text-base font-semibold text-gray-900">
              All Agencies offering this Tour
            </h2>

            <TourAgenciesList
              agencies={agencies}
              // 🔥 Keep prop name the same, but now it routes when authed
              onLoginAlert={requireLoginOrGoTours}
            />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
