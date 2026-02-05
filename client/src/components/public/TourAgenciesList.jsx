// client/src/components/public/TourAgenciesList.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TourAgenciesList({ agencies = [], onLoginAlert }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isAuthed = !!token;

  // selected date per agency_tours row (agency.id = agency_tours.id)
  const [selectedDates, setSelectedDates] = useState({});

  const normalizeDates = (csv) => {
    if (!csv) return [];
    return csv
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
  };

  const handleBookNow = (agency) => {
    if (!isAuthed) {
      onLoginAlert?.();
      return;
    }

    // ✅ IMPORTANT: in your API, agency.id is agency_tours.id (at.id)
    const agencyTourId = Number(agency.id);
    if (!agencyTourId) {
      alert("Missing agency tour info. Please try again.");
      return;
    }

    const picked = selectedDates[agency.id] || "";

    const qs = new URLSearchParams();
    qs.set("agencyTourId", String(agencyTourId)); // ✅ what ConfirmBookingPage expects
    if (picked) qs.set("date", picked);

    // ✅ Screen 13 route (matches your router)
    navigate(`/bookings/confirm?${qs.toString()}`);
  };

  const AgencyDates = ({ agency }) => {
    const dates = useMemo(
      () => normalizeDates(agency.available_dates),
      [agency.available_dates]
    );

    const picked = selectedDates[agency.id] || "";

    if (dates.length === 0) {
      return (
        <>
          <div className="text-[11px] text-gray-500 mb-1">Available dates</div>
          <span className="text-[11px] text-gray-400">To be announced</span>
        </>
      );
    }

    return (
      <>
        <div className="text-[11px] text-gray-500 mb-1">Choose a date</div>

        <div className="flex flex-wrap gap-2">
          {dates.map((date) => {
            const active = picked === date;
            return (
              <button
                key={date}
                type="button"
                onClick={() =>
                  setSelectedDates((prev) => ({
                    ...prev,
                    [agency.id]: active ? "" : date,
                  }))
                }
                className={[
                  "px-2 py-1 rounded-full text-[11px] border transition",
                  active
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-100 text-gray-800 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50",
                ].join(" ")}
                title={active ? "Selected" : "Select this date"}
              >
                {date}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-2 text-[11px] text-emerald-700">
            Selected: <span className="font-semibold">{picked}</span>
          </div>
        )}
      </>
    );
  };

  if (!agencies || agencies.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 text-xs text-gray-500">
        No agencies are currently offering this tour.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agencies.map((agency) => (
        <article
          key={agency.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {agency.agency_name}
              </h3>
              <div className="text-xs text-gray-800 font-medium">
                Rs {Number(agency.price).toLocaleString()}
              </div>
            </div>

            <AgencyDates agency={agency} />
          </div>

          <button
            onClick={() => handleBookNow(agency)}
            className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
          >
            Book Now
          </button>
        </article>
      ))}
    </div>
  );
}
