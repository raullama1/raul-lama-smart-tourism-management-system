import { useEffect, useMemo, useState } from "react";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings, payBooking, cancelBooking } from "../../api/bookingApi";
import { FaFilter, FaCreditCard, FaEye, FaPen, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function BookingsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    q: "",
    date: "All", // All | Last30 | Last90
    status: "All", // All | Pending | Approved | Confirmed | Completed | Cancelled
  });

  const [draft, setDraft] = useState(filters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchMyBookings(token, f);
      setRows(res?.data || []);
    } catch (e) {
      console.error("Failed to load bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const STATUS_STEPS = useMemo(
    () => ["Pending", "Approved", "Confirmed", "Completed"],
    []
  );

  const stepIndex = (status) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx === -1 ? -1 : idx;
  };

  const Chip = ({ active, children, tone = "green" }) => {
    const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border";
    const map = {
      green: active
        ? "bg-emerald-700 text-white border-emerald-700"
        : "bg-emerald-50 text-emerald-700 border-emerald-100",
      amber: active
        ? "bg-amber-400 text-amber-950 border-amber-300"
        : "bg-amber-50 text-amber-800 border-amber-100",
      gray: active
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-gray-50 text-gray-700 border-gray-200",
    };
    return <span className={`${base} ${map[tone]}`}>{children}</span>;
  };

  const handleApply = () => {
    setFilters(draft);
    load(draft);
  };

  const handlePayNow = async (bookingId) => {
    try {
      await payBooking(token, bookingId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === bookingId ? { ...r, payment_status: "Paid" } : r
        )
      );
      // later screen 14: navigate(`/pay/${bookingId}`)
    } catch (e) {
      console.error("Pay failed", e);
      alert("Payment failed. Please try again.");
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await cancelBooking(token, bookingId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === bookingId ? { ...r, booking_status: "Cancelled" } : r
        )
      );
    } catch (e) {
      console.error("Cancel failed", e);
      alert("Cancel failed. Please try again.");
    }
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Booking History
            </h1>
            <p className="text-xs md:text-sm text-emerald-700 mt-1">
              Your past and current bookings with status and payment details.
            </p>

            {/* Filters row */}
            <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
              <input
                value={draft.q}
                onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
                placeholder="Filter: Tour or Agency (Nepal)"
                className="w-full md:w-[320px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />

              <select
                value={draft.date}
                onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
                className="w-full md:w-[160px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              >
                <option value="All">Date: All</option>
                <option value="Last30">Last 30 days</option>
                <option value="Last90">Last 90 days</option>
              </select>

              <select
                value={draft.status}
                onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                className="w-full md:w-[180px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              >
                <option value="All">Status: All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <button
                onClick={handleApply}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
              >
                <FaFilter /> Apply
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-gray-500">
                Loading bookings...
              </div>
            ) : !token ? (
              <div className="p-10 text-center">
                <div className="font-semibold text-gray-900">
                  Please login to view bookings
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                >
                  Go to Login
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No bookings found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full">
                  <thead className="bg-emerald-50 text-gray-800">
                    <tr className="text-left text-sm">
                      <th className="px-4 py-3 font-semibold">Tour</th>
                      <th className="px-4 py-3 font-semibold">Agency</th>
                      <th className="px-4 py-3 font-semibold">Booking Date</th>
                      <th className="px-4 py-3 font-semibold">Booking Status</th>
                      <th className="px-4 py-3 font-semibold">Payment</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {rows.map((b) => {
                      const sIdx = stepIndex(b.booking_status);

                      const unpaid = b.payment_status === "Unpaid";
                      const cancelled = b.booking_status === "Cancelled";
                      const completed = b.booking_status === "Completed";
                      const paid = b.payment_status === "Paid";

                      return (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          {/* Tour */}
                          <td className="px-4 py-4">
                            <div className="flex gap-3 items-start">
                              <img
                                src={b.tour_image_url}
                                alt={b.tour_title}
                                className="h-12 w-16 rounded-lg object-cover border"
                              />
                              <div>
                                <div className="font-semibold text-gray-900 leading-tight">
                                  {b.tour_title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Ref. #{b.ref_code}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Agency */}
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">
                              {b.agency_name}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">
                              {new Date(b.booking_date).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Status chips */}
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {STATUS_STEPS.map((st, idx) => {
                                const active = !cancelled && sIdx >= idx;
                                const tone =
                                  st === "Approved" || st === "Completed"
                                    ? "amber"
                                    : "green";
                                return (
                                  <Chip key={st} active={active} tone={tone}>
                                    {st}
                                  </Chip>
                                );
                              })}

                              {/* Pay chip (just visual like your design) */}
                              <Chip
                                active={!cancelled && paid}
                                tone={!cancelled && paid ? "green" : "gray"}
                              >
                                Pay
                              </Chip>

                              {cancelled && (
                                <Chip active tone="gray">
                                  Cancelled
                                </Chip>
                              )}
                            </div>
                          </td>

                          {/* Payment */}
                          <td className="px-4 py-4">
                            <Chip active tone={unpaid ? "amber" : "green"}>
                              {unpaid ? "Unpaid" : "Paid"}
                            </Chip>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex gap-2 justify-end">
                              {unpaid && !cancelled && (
                                <button
                                  onClick={() => handlePayNow(b.id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                                >
                                  <FaCreditCard /> Pay Now
                                </button>
                              )}

                              {paid && (
                                <button
                                  onClick={() => navigate(`/tours/${b.tour_id}`)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
                                >
                                  <FaEye /> View
                                </button>
                              )}

                              {paid && completed && (
                                <button
                                  onClick={() => navigate(`/review?booking=${b.id}`)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                                >
                                  <FaPen /> Write Review
                                </button>
                              )}

                              {!paid && !cancelled && (
                                <button
                                  onClick={() => handleCancel(b.id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
                                >
                                  <FaTimes /> Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}
