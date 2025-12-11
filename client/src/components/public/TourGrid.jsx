// client/src/components/public/TourGrid.jsx
import { useNavigate } from "react-router-dom";

export default function TourGrid({ tours }) {
  const navigate = useNavigate();

  const handleAlert = () => {
    alert("Please login or signup to access this feature.");
  };

  if (!tours || tours.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500">
        No tours found. Try different filters.
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <article
            key={tour.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Image */}
            <div className="h-44 w-full overflow-hidden">
              <img
                src={tour.image_url}
                alt={tour.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                {tour.title}
              </h3>

              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                {tour.short_description}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 items-center text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                  {tour.type}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {tour.location}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-900">
                <span className="text-gray-500 text-xs">From </span>
                <span className="font-semibold">
                  NPR {Number(tour.starting_price).toLocaleString()}
                </span>
              </div>

              {/* Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate(`/tours/${tour.id}`)}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[11px] md:text-xs font-medium shadow hover:scale-105 transition-transform"
                >
                  View Details
                </button>

                <button
                  onClick={handleAlert}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-[11px] md:text-xs font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                >
                  Add to Wishlist
                </button>

                <button 
                onClick={() => navigate(`/tours/${tour.id}`)}
                className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-[11px] md:text-xs font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all">
                  Show All Agencies
                </button>

                <button
                  onClick={handleAlert}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-[#e6f4ed] text-emerald-700 text-[11px] md:text-xs font-medium shadow hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-500 hover:text-white hover:scale-105 transition-all"
                >
                  View on Map
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
