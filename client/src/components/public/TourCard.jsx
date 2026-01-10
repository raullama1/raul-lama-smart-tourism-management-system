// client/src/components/public/TourCard.jsx
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import {
  FaHeart,
  FaMapMarkerAlt,
  FaUsers,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";

gsap.registerPlugin(Draggable);

export default function TourCard({
  tours,
  showSectionHeader = false,
  cardWidth = "w-64 md:w-72 lg:w-72",
}) {
  const containerRef = useRef(null);
  const draggableRef = useRef(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  const [itemWidth] = useState(288); // base width for smooth scroll
  const gap = 16;

  // ✅ If logged in -> go /home for now, else alert
  const requireLoginOrGoHome = () => {
    if (token) {
      navigate("/home"); // later replace with real screen routes
      return;
    }
    alert("Please login or signup to access this feature.");
  };

  // ✅ Infinite loop helper (same idea as BlogCardSection)
  const loop = (container) => {
    if (!container || !tours.length) return;
    const originalCount = tours.length;
    const totalWidthSingle = originalCount * (itemWidth + gap);
    const x = gsap.getProperty(container, "x");

    if (x <= -totalWidthSingle) {
      gsap.set(container, { x: x + totalWidthSingle });
    } else if (x >= 0) {
      gsap.set(container, { x: x - totalWidthSingle });
    }
  };

  // ✅ GSAP Infinite draggable
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !tours.length) return;

    const originalChildren = Array.from(container.children);
    originalChildren.forEach((item) =>
      container.appendChild(item.cloneNode(true))
    );

    gsap.set(container, { x: 0 });

    draggableRef.current = Draggable.create(container, {
      type: "x",
      inertia: true,
      onDrag: () => loop(container),
      onThrowUpdate: () => loop(container),
    })[0];

    container.addEventListener(
      "pointerdown",
      () => (container.style.cursor = "grabbing")
    );
    container.addEventListener(
      "pointerup",
      () => (container.style.cursor = "grab")
    );
    container.style.cursor = "grab";

    return () => {
      if (draggableRef.current) draggableRef.current.kill();
      const childrenNow = Array.from(container.children);
      childrenNow.slice(originalChildren.length).forEach((el) => el.remove());
      container.style.cursor = "";
    };
  }, [tours, itemWidth]);

  // ✅ Smooth scroll with gsap.to (like BlogCard)
  const scrollLeft = () => {
    const container = containerRef.current;
    if (!container) return;

    gsap.to(container, {
      x: `+=${itemWidth + gap}`,
      duration: 0.3,
      onUpdate: () => loop(container),
      onComplete: () => loop(container),
    });
  };

  const scrollRight = () => {
    const container = containerRef.current;
    if (!container) return;

    gsap.to(container, {
      x: `-=${itemWidth + gap}`,
      duration: 0.3,
      onUpdate: () => loop(container),
      onComplete: () => loop(container),
    });
  };

  return (
    <div className="bg-[#e6f4ec] py-8 md:py-10 relative">
      <section className="max-w-6xl mx-auto px-4 md:px-6 relative">
        {showSectionHeader && (
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              Popular Tours
            </h2>
          </div>
        )}

        {/* Arrows */}
        <button
          onClick={scrollLeft}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
        >
          <FaChevronLeft size={20} />
        </button>

        <button
          onClick={scrollRight}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
        >
          <FaChevronRight size={20} />
        </button>

        {/* Cards */}
        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-5 select-none"
            style={{ width: "max-content", alignItems: "stretch" }}
          >
            {tours.map((tour) => (
              <div key={tour.id} className={`flex-shrink-0 ${cardWidth}`}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={tour.image}
                    alt={tour.name}
                    className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">
                      {tour.name}
                    </h3>

                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                      <span>{tour.location}</span>
                      <span>•</span>
                      <span>{tour.type}</span>
                    </div>

                    <div className="mt-2 text-sm text-gray-800">
                      <span className="text-gray-500">From </span>
                      <span className="font-semibold">
                        Rs {tour.price.toLocaleString()}
                      </span>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {/* View Details → go to tour details */}
                      <button
                        onClick={() => navigate(`/tours/${tour.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs md:text-sm font-medium shadow hover:scale-105 transition-transform"
                      >
                        <FaEye size={14} /> View Details
                      </button>

                      {/* Wishlist → login? alert : /home */}
                      <button
                        onClick={requireLoginOrGoHome}
                        className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-xs md:text-sm font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                      >
                        <FaHeart size={14} /> Add to Wishlist
                      </button>

                      {/* Show All Agencies → go to same details section */}
                      <button
                        onClick={() => navigate(`/tours/${tour.id}#agencies`)}
                        className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-xs md:text-sm font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                      >
                        <FaUsers size={14} /> Show All Agencies
                      </button>

                      {/* View on Map → login? alert : /home */}
                      <button
                        onClick={requireLoginOrGoHome}
                        className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-xs md:text-sm font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                      >
                        <FaMapMarkerAlt size={14} /> View on Map
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
