// client/src/components/public/TourAgenciesList.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function safeYMD(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  // Works for "YYYY-MM-DD" and for MySQL datetime strings
  return s.slice(0, 10);
}

function splitAvailableDates(raw) {
  const s = String(raw || "").trim();
  if (!s || !s.includes("|")) return { start: "", end: "" };
  const [a, b] = s.split("|");
  return { start: safeYMD(a), end: safeYMD(b) };
}

export default function TourAgenciesList({ agencies = [], onLoginAlert }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isAuthed = !!token;

  // Picked season per agency_tour_id (optional)
  const [picked, setPicked] = useState({});

  const handleBookNow = (agency) => {
    if (!isAuthed) {
      onLoginAlert?.();
      return;
    }

    // New API: agency_tour_id. Old fallback: agency.id
    const agencyTourId = Number(agency.agency_tour_id || agency.id);
    if (!agencyTourId) {
      alert("Missing agency tour info. Please try again.");
      return;
    }

    const chosen = picked[String(agencyTourId)] || "";

    const qs = new URLSearchParams();
    qs.set("agencyTourId", String(agencyTourId));
    if (chosen) qs.set("date", chosen);

    navigate(`/bookings/confirm?${qs.toString()}`);
  };

  const AgencyDates = ({ agency }) => {
    const agencyTourId = Number(agency.agency_tour_id || agency.id);

    const range = useMemo(() => {
      const start = safeYMD(agency.start_date);
      const end = safeYMD(agency.end_date);

      if (start && end) return { start, end, source: "columns" };

      const parsed = splitAvailableDates(agency.available_dates);
      if (parsed.start && parsed.end) return { ...parsed, source: "legacy" };

      return { start: "", end: "", source: "none" };
    }, [agency.start_date, agency.end_date, agency.available_dates]);

    if (!range.start || !range.end) {
      return (
        <>
          <div className="text-[11px] text-gray-500 mb-1">Available dates</div>
          <span className="text-[11px] text-gray-400">To be announced</span>
        </>
      );
    }

    const label = `${range.start} → ${range.end}`;
    const active = picked[String(agencyTourId)] === label;

    return (
      <>
        <div className="text-[11px] text-gray-500 mb-1">Available period</div>

        <button
          type="button"
          onClick={() =>
            setPicked((prev) => ({
              ...prev,
              [String(agencyTourId)]: active ? "" : label,
            }))
          }
          className={[
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] border transition",
            active
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-gray-100 text-gray-800 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50",
          ].join(" ")}
          title={active ? "Selected" : "Select this period"}
        >
          {label}
          {range.source === "legacy" ? (
            <span className="text-[10px] opacity-80"></span>
          ) : null}
        </button>

        {active ? (
          <div className="mt-2 text-[11px] text-emerald-700">
            Selected: <span className="font-semibold">{label}</span>
          </div>
        ) : null}
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
      {agencies.map((agency) => {
        const agencyTourId = Number(agency.agency_tour_id || agency.id);

        return (
          <article
            key={agencyTourId || `${agency.agency_id}-${agency.agency_name}-${agency.price}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {agency.agency_name}
                </h3>
                <div className="text-xs text-gray-800 font-medium">
                  Rs {Number(agency.price || 0).toLocaleString("en-NP")}
                </div>
              </div>

              <AgencyDates agency={agency} />
            </div>

            <button
              type="button"
              onClick={() => handleBookNow(agency)}
              className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
            >
              Book Now
            </button>
          </article>
        );
      })}
    </div>
  );
}