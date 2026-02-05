// client/src/pages/tourist/BookingsPage.jsx
import { useEffect, useMemo, useState } from "react";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings, payBooking, cancelBooking } from "../../api/bookingApi";
import {
  FaFilter,
  FaCreditCard,
  FaEye,
  FaPen,
  FaTimes,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function BookingsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ q: "", date: "All", status: "All" });
  const [draft, setDraft] = useState(filters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState(null);

  // Cancel popup state
  const [cancelModal, setCancelModal] = useState({
    open: false,
    bookingId: null,
    tourTitle: "",
    refCode: "",
  });

  const load = async (f = filters) => {
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchMyBookings(f);
      setRows(res?.data || []);
    } catch (e) {
      console.error("Failed to load bookings", e);
      alert("Failed to load bookings.");
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

  // Current status badge (stands out)
  const StatusBadge = ({ status }) => {
    const map = {
      Pending: "bg-amber-500 text-white",
      Approved: "bg-indigo-600 text-white",
      Confirmed: "bg-emerald-700 text-white",
      Completed: "bg-gray-900 text-white",
      Cancelled: "bg-gray-400 text-white",
    };

    return (
      <span
        className={[
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm",
          map[status] || "bg-gray-700 text-white",
        ].join(" ")}
        title="Current status"
      >
        {status}
      </span>
    );
  };

  const StepChip = ({ active, children }) => (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border",
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-gray-50 text-gray-500 border-gray-200",
      ].join(" ")}
    >
      {children}
    </span>
  );

  const PaymentChip = ({ paid }) => (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
        paid
          ? "bg-emerald-700 text-white border-emerald-700"
          : "bg-amber-50 text-amber-800 border-amber-100",
      ].join(" ")}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );

  // Button micro-interaction helpers (simple)
  const actionBase =
    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200";
  const lift =
    "hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-sm";

  const handleApply = () => {
    setFilters(draft);
    load(draft);
  };

  const handlePayNow = async (bookingId) => {
    if (busyId) return;

    try {
      setBusyId(bookingId);
      await payBooking(bookingId);

      setRows((prev) =>
        prev.map((r) =>
          r.id === bookingId ? { ...r, payment_status: "Paid" } : r
        )
      );
    } catch (e) {
      console.error("Pay failed", e);
      alert(e?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // Open cancel popup
  const openCancelModal = (b) => {
    setCancelModal({
      open: true,
      bookingId: b.id,
      tourTitle: b.tour_title || "",
      refCode: b.ref_code || "",
    });
  };

  // Close cancel popup
  const closeCancelModal = () => {
    setCancelModal({ open: false, bookingId: null, tourTitle: "", refCode: "" });
  };

  // Confirm cancel inside popup
  const confirmCancel = async () => {
    const bookingId = cancelModal.bookingId;
    if (!bookingId || busyId) return;

    try {
      setBusyId(bookingId);
      await cancelBooking(bookingId);

      setRows((prev) =>
        prev.map((r) =>
          r.id === bookingId ? { ...r, booking_status: "Cancelled" } : r
        )
      );

      closeCancelModal();
    } catch (e) {
      console.error("Cancel failed", e);
      alert(e?.response?.data?.message || "Cancel failed. Please try again.");
    } finally {
      setBusyId(null);
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

            {/* Filters */}
            <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
              <input
                value={draft.q}
                onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
                placeholder="Filter: Tour or Agency"
                className="w-full md:w-[320px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />

              <select
                value={draft.date}
                onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
                className="w-full md:w-[170px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              >
                <option value="All">Date: All</option>
                <option value="Last30">Last 30 days</option>
                <option value="Last90">Last 90 days</option>
              </select>

              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, status: e.target.value }))
                }
                className="w-full md:w-[200px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
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
                className={[
                  actionBase,
                  lift,
                  "w-full md:w-auto justify-center border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                ].join(" ")}
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
                  className={[
                    actionBase,
                    lift,
                    "mt-4 bg-emerald-700 text-white hover:bg-emerald-800",
                  ].join(" ")}
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
                <table className="min-w-[1050px] w-full">
                  <thead className="bg-emerald-50 text-gray-800">
                    <tr className="text-left text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 font-bold">Tour</th>
                      <th className="px-4 py-3 font-bold">Agency</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">
                        Booking Date
                      </th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Payment</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {rows.map((b) => {
                      const cancelled = b.booking_status === "Cancelled";
                      const paid = b.payment_status === "Paid";
                      const unpaid = b.payment_status === "Unpaid";
                      const completed = b.booking_status === "Completed";

                      const sIdx = stepIndex(b.booking_status);
                      const rowBusy = busyId === b.id;

                      return (
                        <tr key={b.id} className="hover:bg-gray-50/50">
                          {/* Tour */}
                          <td className="px-4 py-4">
                            <div className="flex gap-3 items-center">
                              <img
                                src={b.tour_image_url}
                                alt={b.tour_title}
                                className="h-12 w-16 rounded-xl object-cover border"
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

                          {/* Booking Date */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">
                              {new Date(b.booking_date).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-500 font-semibold">
                                  Current:
                                </span>
                                <StatusBadge status={b.booking_status} />
                              </div>

                              {!cancelled && (
                                <div className="flex flex-wrap gap-2">
                                  {STATUS_STEPS.map((st, idx) => (
                                    <StepChip key={st} active={sIdx >= idx}>
                                      {st}
                                    </StepChip>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Payment */}
                          <td className="px-4 py-4">
                            <PaymentChip paid={paid} />
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex gap-2 justify-end flex-nowrap">
                              {unpaid && !cancelled && (
                                <button
                                  disabled={rowBusy}
                                  onClick={() => navigate(`/payment/${b.id}`)}
                                  className={[
                                    actionBase,
                                    lift,
                                    rowBusy
                                      ? "bg-emerald-300 text-white cursor-not-allowed animate-pulse"
                                      : "bg-emerald-700 text-white hover:bg-emerald-800",
                                  ].join(" ")}
                                >
                                  <FaCreditCard />
                                  {rowBusy ? "Processing..." : "Pay Now"}
                                </button>
                              )}

                              {paid && (
                                <button
                                  onClick={() => navigate(`/tours/${b.tour_id}`)}
                                  className={[
                                    actionBase,
                                    lift,
                                    "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                                  ].join(" ")}
                                >
                                  <FaEye /> View
                                </button>
                              )}

                              {paid && completed && (
                                <button
                                  onClick={() => navigate(`/review?booking=${b.id}`)}
                                  className={[
                                    actionBase,
                                    lift,
                                    "bg-emerald-700 text-white hover:bg-emerald-800",
                                  ].join(" ")}
                                >
                                  <FaPen /> Write Review
                                </button>
                              )}

                              {!paid && !cancelled && (
                                <button
                                  disabled={rowBusy}
                                  onClick={() => openCancelModal(b)}
                                  className={[
                                    actionBase,
                                    lift,
                                    rowBusy
                                      ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                      : "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300",
                                  ].join(" ")}
                                >
                                  <FaTimes />
                                  {rowBusy ? "Cancelling..." : "Cancel"}
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

        {/* Cancel Popup Modal */}
        {cancelModal.open && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeCancelModal();
            }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header with X */}
              <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                    <FaExclamationTriangle />
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-900">
                      Cancel Booking?
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      This action cannot be undone.
                    </div>
                  </div>
                </div>

                <button
                  onClick={closeCancelModal}
                  className="text-gray-400 hover:text-gray-700 transition"
                  title="Close"
                >
                  <FaTimesCircle size={20} />
                </button>
              </div>

              <div className="p-5 space-y-2">
                <div className="text-sm text-gray-800">
                  <span className="font-semibold">{cancelModal.tourTitle}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Ref:{" "}
                  <span className="font-semibold">#{cancelModal.refCode}</span>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2 justify-end">
                <button
                  onClick={closeCancelModal}
                  className={[
                    actionBase,
                    lift,
                    "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                  ].join(" ")}
                >
                  Keep Booking
                </button>

                <button
                  disabled={busyId === cancelModal.bookingId}
                  onClick={confirmCancel}
                  className={[
                    actionBase,
                    lift,
                    busyId === cancelModal.bookingId
                      ? "bg-red-300 text-white cursor-not-allowed animate-pulse"
                      : "bg-red-600 text-white hover:bg-red-700",
                  ].join(" ")}
                >
                  {busyId === cancelModal.bookingId
                    ? "Cancelling..."
                    : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <FooterTourist />
    </>
  );
}
