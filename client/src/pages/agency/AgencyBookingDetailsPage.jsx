// client/src/pages/agency/AgencyBookingDetailsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMessageSquare,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import {
  approveAgencyBooking,
  fetchAgencyBookingDetails,
  rejectAgencyBooking,
} from "../../api/agencyBookingsApi";
import {
  toPublicImageUrl,
  FALLBACK_TOUR_IMG,
} from "../../utils/publicImageUrl";

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

function fmtYMDLong(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function splitDates(raw) {
  const v = String(raw || "");
  const [a, b] = v.split("|");
  return { start: a ? a.trim() : "", end: b ? b.trim() : "" };
}

function uiStatus(bookingStatus) {
  const s = String(bookingStatus || "").toLowerCase();
  if (s === "pending") return "Requested";
  if (s === "approved") return "Approved";
  if (s === "confirmed") return "In Progress";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return "—";
}

function StatusChip({ label, tone = "gray" }) {
  const styles =
    tone === "green"
      ? "bg-emerald-700 text-white"
      : tone === "orange"
        ? "bg-amber-500 text-white"
        : tone === "gray"
          ? "bg-gray-100 text-gray-900"
          : "bg-white text-gray-900 border border-gray-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-black",
        styles,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function Step({ label, active = false, done = false }) {
  const base =
    "flex-1 rounded-xl border px-3 py-3 text-sm font-black inline-flex items-center justify-center gap-2";
  const cls = done
    ? "bg-emerald-800 border-emerald-800 text-white"
    : active
      ? "bg-amber-100 border-amber-200 text-amber-900"
      : "bg-white border-emerald-100 text-emerald-900/70";

  return (
    <div className={[base, cls].join(" ")}>
      {done ? <FiCheckCircle /> : null}
      {label}
    </div>
  );
}

export default function AgencyBookingDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const showToast = (t, m) => {
    setToast({ open: true, type: t, message: m });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await fetchAgencyBookingDetails(bookingId);
      setRow(res?.data || null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load booking details.");
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const derived = useMemo(() => {
    const tourListingStatus = String(row?.tour_listing_status || "")
      .trim()
      .toLowerCase();

    const bookingStatusRaw = String(row?.booking_status || "")
      .trim()
      .toLowerCase();

    // If the tour listing is completed, force the UI status to completed.
    const effectiveStatus =
      tourListingStatus === "completed" ? "completed" : bookingStatusRaw;

    const paymentStatus = String(row?.payment_status || "").toLowerCase();

    const canApprove =
      effectiveStatus === "pending" && paymentStatus === "unpaid";
    const canReject = effectiveStatus === "pending";

    const scheduleLabel = row?.selected_date_label?.trim();
    const fromAgencyDates = splitDates(row?.agency_available_dates);
    const schedule =
      scheduleLabel ||
      (fromAgencyDates.start && fromAgencyDates.end
        ? `${fmtYMDLong(fromAgencyDates.start)} - ${fmtYMDLong(fromAgencyDates.end)}`
        : "—");

    const img = toPublicImageUrl(row?.tour_image_url) || FALLBACK_TOUR_IMG;

    const statusLabel = uiStatus(effectiveStatus);

    const paymentLabel = String(row?.payment_status || "Unpaid");
    const paymentTone =
      String(row?.payment_status || "").toLowerCase() === "paid"
        ? "green"
        : "gray";

    const topStatusTone =
      effectiveStatus === "completed"
        ? "green"
        : effectiveStatus === "confirmed"
          ? "orange"
          : effectiveStatus === "approved"
            ? "green"
            : "gray";

    const steps = {
      requested: effectiveStatus !== "cancelled",
      approved:
        effectiveStatus === "approved" ||
        effectiveStatus === "confirmed" ||
        effectiveStatus === "completed",
      payment: String(row?.payment_status || "").toLowerCase() === "paid",
      inProgress: effectiveStatus === "confirmed",
      completed: effectiveStatus === "completed",
      cancelled: effectiveStatus === "cancelled",
    };

    return {
      canApprove,
      canReject,
      schedule,
      img,
      statusLabel,
      paymentLabel,
      paymentTone,
      topStatusTone,
      effectiveStatus,
      steps,
    };
  }, [row]);

  const onApprove = async () => {
    try {
      setBusy(true);
      await approveAgencyBooking(bookingId);
      showToast("success", "Booking approved.");
      await load();
    } catch (e) {
      showToast(
        "error",
        e?.response?.data?.message || "Failed to approve booking.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    try {
      setBusy(true);
      await rejectAgencyBooking(bookingId);
      showToast("success", "Booking rejected.");
      await load();
    } catch (e) {
      showToast(
        "error",
        e?.response?.data?.message || "Failed to reject booking.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AgencyLayout>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-gray-900">
              Booking Details
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Review booking information and take action.
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/agency/bookings")}
            className="h-10 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-900 hover:bg-emerald-50 inline-flex items-center gap-2"
          >
            <FiArrowLeft />
            Back to Bookings
          </button>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-gray-600">Loading...</div>
        ) : err ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {err}
          </div>
        ) : !row ? (
          <div className="mt-6 text-sm text-gray-600">Booking not found.</div>
        ) : (
          <>
            {/* Top summary card */}
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-emerald-100 bg-white">
                    <img
                      src={derived.img}
                      alt={row.tour_title || "Tour"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_TOUR_IMG;
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-gray-900 line-clamp-1">
                      {row.tour_title || "—"}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-600">
                      Ref: {row.ref_code || "—"} • Created{" "}
                      {fmtYMDLong(row.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    label={`Payment: ${derived.paymentLabel}`}
                    tone={derived.paymentTone}
                  />
                  <StatusChip
                    label={`Status: ${derived.statusLabel}`}
                    tone={derived.topStatusTone}
                  />
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-5">
              <div className="text-sm font-extrabold text-gray-900">
                Booking Overview
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-emerald-900/70 font-bold">
                      Tour Name
                    </div>
                    <div className="text-gray-900 font-extrabold text-right">
                      {row.tour_title || "—"}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="text-emerald-900/70 font-bold">
                      Tourist Information
                    </div>
                    <div className="text-gray-900 font-extrabold text-right">
                      {row.tourist_name || "—"} • {row.tourist_email || "—"}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="text-emerald-900/70 font-bold">
                      Booking Date
                    </div>
                    <div className="text-gray-900 font-extrabold text-right">
                      {fmtYMDLong(row.booking_date)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-emerald-900/70 font-bold">
                      Travelers Count
                    </div>
                    <div className="text-gray-900 font-extrabold text-right">
                      {Number(row.travelers || 1)}{" "}
                      {Number(row.travelers || 1) === 1
                        ? "Traveler"
                        : "Travelers"}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="text-emerald-900/70 font-bold">
                      Current Booking Status
                    </div>
                    <div className="text-gray-900 font-extrabold text-right">
                      {derived.statusLabel}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="text-emerald-900/70 font-bold">
                      Payment Status
                    </div>
                    <div className="text-gray-900 font-extrabold text-right">
                      {derived.paymentLabel}
                      {Number(row.total_price || 0) > 0 ? (
                        <span className="text-gray-500 font-bold">
                          {" "}
                          • Amount: NPR{" "}
                          {Number(row.total_price || 0).toLocaleString("en-NP")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price & schedule */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-100 bg-white p-5">
                <div className="text-sm font-extrabold text-gray-900">
                  Agency Price & Schedule
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <div className="text-xs font-black text-emerald-900/70">
                    Agency Price (per person)
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-gray-900">
                    NPR{" "}
                    {Number(row.agency_price_per_person || 0).toLocaleString(
                      "en-NP",
                    )}
                  </div>

                  <div className="mt-3 text-xs font-black text-emerald-900/70">
                    Total ({Number(row.travelers || 1)}{" "}
                    {Number(row.travelers || 1) === 1
                      ? "traveler"
                      : "travelers"}
                    )
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-gray-900">
                    NPR {Number(row.total_price || 0).toLocaleString("en-NP")}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-5">
                <div className="text-sm font-extrabold text-gray-900">
                  Schedule
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                  <div className="text-sm font-extrabold text-gray-900">
                    {derived.schedule}
                  </div>

                  <div className="mt-3 text-xs font-black text-emerald-900/70">
                    Itinerary Highlights
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900 line-clamp-3">
                    {row.tour_description
                      ? String(row.tour_description).trim()
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="mt-6 flex justify-end">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={!derived.canApprove || busy}
                  className="h-11 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-900 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <FiCheckCircle />
                  Approve Booking
                </button>

                <button
                  type="button"
                  onClick={onReject}
                  disabled={!derived.canReject || busy}
                  className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <FiXCircle />
                  Reject Booking
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const touristId = Number(row?.tourist_id);
                    if (!touristId) {
                      showToast(
                        "error",
                        "Tourist id not found for this booking.",
                      );
                      return;
                    }
                    navigate(`/agency/chat?touristId=${touristId}`);
                  }}
                  className="h-11 rounded-2xl bg-emerald-800 px-5 text-sm font-black text-white hover:bg-emerald-900 inline-flex items-center justify-center gap-2"
                >
                  <FiMessageSquare />
                  Chat with Tourist
                </button>
              </div>
            </div>
          </>
        )}
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
