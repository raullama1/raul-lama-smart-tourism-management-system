// client/src/components/public/HeroSection.jsx
import { FaMapMarkerAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  // Redirects user to Tours page
  const handleExploreClick = () => {
    navigate("/tours");
  };

  // Redirects user to Map page
  const handleMapClick = () => {
    navigate("/map");
  };

  return (
    <section className="bg-[#e6f4ec]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Hero Image */}
        <div className="rounded-3xl overflow-hidden mb-6 md:mb-8 shadow-lg">
          <img
            src="https://images.pexels.com/photos/672358/pexels-photo-672358.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Nepal mountains"
            className="w-full h-56 md:h-72 lg:h-80 object-cover"
          />
        </div>

        {/* Text + Buttons */}
        <div className="text-center relative">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
            Discover Amazing Tours &amp; Travel Packages
          </h1>
          <p className="mt-3 text-base md:text-lg text-gray-600">
            Compare tours across Nepal from trusted local agencies
          </p>

          {/* Buttons */}
          <div className="mt-6 flex flex-col items-center gap-2 relative">
            <button
              onClick={handleExploreClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-base shadow-lg hover:scale-105 transition-transform"
            >
              Explore Tours
            </button>

            <div className="relative w-full flex justify-center items-center">
              <button
                onClick={handleMapClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-emerald-600 text-emerald-600 font-semibold text-base bg-white shadow-md hover:bg-emerald-50 hover:scale-105 transition-all"
              >
                <span>Discover Tours on Nepal Map</span>
                <FaMapMarkerAlt className="text-lg" />
              </button>

              <FaChevronDown
                className="hidden md:block absolute left-0 -translate-x-6 -bottom-5 text-gray-400 animate-bounce"
                size={28}
              />
              <FaChevronDown
                className="hidden md:block absolute right-0 translate-x-6 -bottom-5 text-gray-400 animate-bounce"
                size={28}
              />
            </div>

            <FaChevronDown className="block md:hidden mt-3 text-gray-400 animate-bounce" size={28} />
          </div>
        </div>
      </div>
    </section>
  );
}
