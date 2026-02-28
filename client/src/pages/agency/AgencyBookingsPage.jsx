// client/src/pages/agency/AgencyBookingsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiEye,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiBell,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import {
  approveAgencyBooking,
  fetchAgencyBookings,
  rejectAgencyBooking,
} from "../../api/agencyBookingsApi";

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[400] pointer-events-none">
      <div
        className={[
          "pointer-events-auto w-[340px] rounded-2xl border px-4 py-3 shadow-lg",
          "transition-all duration-300 ease-out",
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          boxClass,
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-700/70 hover:text-gray-900 hover:bg-black/5"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="pr-8 text-sm font-semibold">{message}</div>
      </div>
    </div>
  );
}

function StatusPill({ v }) {
  const s = String(v || "").toLowerCase();

  const map = {
    pending: "bg-amber-50 text-amber-900 border-amber-200",
    approved: "bg-blue-50 text-blue-900 border-blue-200",
    confirmed: "bg-emerald-50 text-emerald-900 border-emerald-200",
    completed: "bg-gray-50 text-gray-900 border-gray-200",
    rejected: "bg-red-50 text-red-900 border-red-200",
    cancelled: "bg-red-50 text-red-900 border-red-200",
    canceled: "bg-red-50 text-red-900 border-red-200",
  };

  const label = s ? s[0].toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black",
        map[s] || "bg-gray-50 text-gray-900 border-gray-200",
      ].join(" ")}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}

function PaymentPill({ v }) {
  const s = String(v || "").toLowerCase();

  const map = {
    unpaid: "bg-amber-50 text-amber-900 border-amber-200",
    pending: "bg-amber-50 text-amber-900 border-amber-200",
    paid: "bg-emerald-50 text-emerald-900 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-900 border-emerald-200",
  };

  const pretty = s ? s[0].toUpperCase() + s.slice(1) : "—";

  return (
    <span
      className={[
        "inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-black",
        map[s] || "bg-gray-50 text-gray-900 border-gray-200",
      ].join(" ")}
    >
      {pretty}
    </span>
  );
}

function formatYMD(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default function AgencyBookingsPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [sort, setSort] = useState("latest");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const [busyId, setBusyId] = useState(null);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const params = useMemo(() => {
    return {
      status,
      payment,
      sort,
      q: debouncedQ,
    };
  }, [status, payment, sort, debouncedQ]);

  const load = async (first = false) => {
    try {
      setErr("");
      if (first) setLoading(true);
      else setFetching(true);

      const res = await fetchAgencyBookings(params);
      setRows(res?.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load bookings.");
      setRows([]);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.status, params.payment, params.sort, params.q]);

  const canApproveReject = (b) => {
    const s = String(b?.booking_status || b?.status || "").toLowerCase();
    const p = String(b?.payment_status || "").toLowerCase();
    return s === "pending" && (p === "unpaid" || !p);
  };

  const onApprove = async (bookingId) => {
    try {
      setBusyId(bookingId);
      await approveAgencyBooking(bookingId);
      showToast("success", "Booking approved.");
      await load(false);
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to approve booking.");
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (bookingId) => {
    try {
      setBusyId(bookingId);
      await rejectAgencyBooking(bookingId);
      showToast("success", "Booking rejected.");
      await load(false);
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to reject booking.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AgencyLayout>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold text-gray-900">Tour Bookings</div>
            <div className="text-xs text-gray-500 mt-1">
              Manage bookings for your tours.
            </div>
          </div>

          <button
            type="button"
            className="h-10 w-10 rounded-2xl border border-emerald-100 bg-white grid place-items-center text-emerald-900 hover:bg-emerald-50 relative"
            title="Notifications"
          >
            <FiBell />
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-[11px] font-black grid place-items-center">
              3
            </span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by tour name, tourist name, or ref code..."
                className="h-11 w-full rounded-2xl border border-emerald-100 bg-white pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="h-11 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="all">All Payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>

              <button
                type="button"
                onClick={() => load(false)}
                className="h-11 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-900 hover:bg-emerald-50 inline-flex items-center justify-center gap-2"
                disabled={fetching}
                title="Refresh"
              >
                <span className={fetching ? "animate-spin" : ""}>
                  <FiRefreshCw />
                </span>
                Refresh
              </button>
            </div>
          </div>

          {fetching ? (
            <div className="mt-3 text-xs font-semibold text-gray-600">
              Updating...
            </div>
          ) : null}
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {err}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full">
              <thead className="bg-emerald-50/70">
                <tr className="text-left text-[11px] font-black text-emerald-900/70">
                  <th className="px-5 py-4">Tour Name</th>
                  <th className="px-5 py-4">Tourist Name</th>
                  <th className="px-5 py-4">Booking Date</th>
                  <th className="px-5 py-4">Travelers</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-sm text-gray-600">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-sm text-gray-600">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  rows.map((b) => {
                    const bookingId = b.booking_id ?? b.id;

                    const tourTitle = b.tour_title ?? "—";
                    const tourLocation = b.tour_location ?? "";

                    const touristName = b.tourist_name ?? "—";
                    const touristEmail = b.tourist_email ?? "";

                    const bookingDate = formatYMD(b.booking_date ?? b.created_at);
                    const travelers = Number(b.travelers);

                    const statusVal = b.booking_status ?? b.status;
                    const paymentVal = b.payment_status ?? "Unpaid";

                    const approveReject = canApproveReject(b);
                    const isBusy = busyId === bookingId;

                    return (
                      <tr key={bookingId} className="hover:bg-emerald-50/30">
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-extrabold text-gray-900 leading-snug">
                            {tourTitle}
                          </div>
                          {tourLocation ? (
                            <div className="mt-1 text-xs text-gray-500">{tourLocation}</div>
                          ) : null}
                          {b.ref_code ? (
                            <div className="mt-2 inline-flex items-center rounded-xl border border-emerald-100 bg-white px-3 py-1 text-[11px] font-black text-emerald-900/80">
                              Ref: {b.ref_code}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-bold text-gray-900">{touristName}</div>
                          {touristEmail ? (
                            <div className="mt-1 text-xs text-gray-500">{touristEmail}</div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-bold text-gray-900">{bookingDate}</div>
                          {b.selected_date_label ? (
                            <div className="mt-1 text-xs text-gray-500">{b.selected_date_label}</div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className="inline-flex items-center rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-black text-emerald-900">
                            {Number.isFinite(travelers) && travelers > 0 ? travelers : 1}{" "}
                            {Number.isFinite(travelers) && travelers === 1 ? "Traveler" : "Travelers"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <StatusPill v={statusVal} />
                        </td>

                        <td className="px-5 py-4 align-top">
                          <PaymentPill v={paymentVal} />
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/agency/bookings/${bookingId}`)}
                              className="h-10 w-10 rounded-2xl border border-gray-200 bg-white grid place-items-center text-gray-900 hover:bg-gray-50"
                              title="View details"
                            >
                              <FiEye />
                            </button>

                            {approveReject ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onApprove(bookingId)}
                                  disabled={isBusy}
                                  className="h-10 w-10 rounded-2xl bg-emerald-800 grid place-items-center text-white hover:bg-emerald-900 disabled:opacity-60"
                                  title="Approve booking"
                                >
                                  <FiCheck />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onReject(bookingId)}
                                  disabled={isBusy}
                                  className="h-10 w-10 rounded-2xl bg-red-600 grid place-items-center text-white hover:bg-red-700 disabled:opacity-60"
                                  title="Reject booking"
                                >
                                  <FiX />
                                </button>
                              </>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => showToast("success", "Chat wiring can be connected next.")}
                              className="h-10 w-10 rounded-2xl border border-gray-200 bg-white grid place-items-center text-gray-900 hover:bg-gray-50"
                              title="Chat"
                            >
                              <FiMessageSquare />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </AgencyLayout>
  );
}