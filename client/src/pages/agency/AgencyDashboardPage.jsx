// client/src/pages/agency/AgencyDashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FiBell, FiRefreshCw, FiPlus } from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { getAgencyDashboard } from "../../api/agencyDashboardApi";

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : tone === "docs"
      ? "bg-sky-50 text-sky-700 border-sky-100"
      : tone === "confirmed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-gray-50 text-gray-700 border-gray-100";

  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700">
          {icon}
        </div>
        <div className="leading-tight">
          <div className="text-[11px] text-gray-500">{label}</div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Stars({ value }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? "text-amber-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function AgencyDashboardPage() {
  const { agency } = useAgencyAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    stats: { activeTours: 0, bookings: 0, pendingRequests: 0, earningsNpr: 0 },
    recentBookings: [],
    recentReviews: [],
  });

  const title = useMemo(() => {
    const n = agency?.name ? String(agency.name) : "Agency";
    return `Dashboard — ${n}`;
  }, [agency]);

  const fetchData = async (mode = "load") => {
    try {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);

      setError("");
      const res = await getAgencyDashboard();
      setData(res);
    } catch (err) {
      console.error("getAgencyDashboard error", err);
      setError(err?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData("load");
  }, []);

  const fmtNpr = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("en-US");
  };

  const statusTone = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "pending";
    if (s.includes("await")) return "docs";
    if (s === "confirmed" || s === "completed") return "confirmed";
    return "neutral";
  };

  return (
    <AgencyLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-500 mt-1">Overview of your tours, bookings and reviews</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative h-10 w-10 rounded-xl border border-gray-200 bg-white grid place-items-center text-gray-700 hover:bg-gray-50"
              aria-label="Notifications"
            >
              <FiBell />
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold grid place-items-center">
                3
              </span>
            </button>

            <button
              type="button"
              onClick={() => fetchData("refresh")}
              disabled={refreshing}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <FiRefreshCw />
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <button
              type="button"
              className="h-10 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              <span className="inline-flex items-center gap-2">
                <FiPlus />
                New Tour
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <KpiCard icon={<span>🧭</span>} label="Active Tours" value={data.stats.activeTours} />
          <KpiCard icon={<span>📅</span>} label="Bookings" value={data.stats.bookings} />
          <KpiCard icon={<span>⏳</span>} label="Pending Requests" value={data.stats.pendingRequests} />
          <KpiCard
            icon={<span>💳</span>}
            label="Earnings (NPR)"
            value={`NPR ${fmtNpr(data.stats.earningsNpr)}`}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Recent Bookings</div>
              <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline">
                View More
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : data.recentBookings.length === 0 ? (
                <div className="text-sm text-gray-500">No bookings yet.</div>
              ) : (
                data.recentBookings.map((b) => (
                  <div key={b.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {b.tour_title} • {b.travelers} {b.travelers === 1 ? "Guest" : "Guests"}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          by {b.user_name} • {b.booking_date_label} • {b.payment_label}
                        </div>
                      </div>
                      <Pill tone={statusTone(b.booking_status)}>{b.booking_status}</Pill>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-center text-xs text-gray-600">
              View More or scrollable
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Recent Reviews</div>
              <button type="button" className="text-xs font-semibold text-emerald-700 hover:underline">
                View More
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : data.recentReviews.length === 0 ? (
                <div className="text-sm text-gray-500">No reviews yet.</div>
              ) : (
                data.recentReviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{r.user_name}</div>
                          <Stars value={r.rating} />
                        </div>
                        <div className="mt-1 text-[12px] text-gray-700">
                          “{r.comment}”
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-center text-xs text-gray-600">
              View More or scrollable
            </div>
          </div>
        </div>
      </div>
    </AgencyLayout>
  );
}
