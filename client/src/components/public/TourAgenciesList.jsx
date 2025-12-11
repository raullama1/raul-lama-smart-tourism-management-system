// client/src/components/public/TourAgenciesList.jsx
export default function TourAgenciesList({ agencies, onLoginAlert }) {
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
        const dates = agency.available_dates
          ? agency.available_dates.split(",").map((d) => d.trim())
          : [];

        return (
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

              <div className="text-[11px] text-gray-500 mb-1">
                Available dates
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {dates.length > 0 ? (
                  dates.map((date, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-full bg-gray-100 text-[11px] text-gray-800"
                    >
                      {date}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-gray-400">
                    To be announced
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onLoginAlert}
              className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
            >
              Book Now
            </button>
          </article>
        );
      })}
    </div>
  );
}
