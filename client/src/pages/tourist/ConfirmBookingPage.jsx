// client/src/pages/tourist/ConfirmBookingPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchBookingPreview, createBooking } from "../../api/bookingApi";
import { FaCheckCircle } from "react-icons/fa";

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[200] pointer-events-none">
      <div
        className={[
          "pointer-events-auto relative w-[320px] rounded-2xl border px-4 py-3 shadow-lg",
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
          aria-label="Close notification"
        >
          ✕
        </button>

        <div className="pr-8 text-sm font-semibold">{message}</div>
      </div>
    </div>
  );
}

function safeYMD(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.slice(0, 10);
}

function parsePipeRange(raw) {
  const s = String(raw || "").trim();
  if (!s || !s.includes("|")) return { start: "", end: "" };
  const [a, b] = s.split("|");
  return { start: safeYMD(a), end: safeYMD(b) };
}

function normalizeCsvDates(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

function makeRangeLabel(start, end) {
  const a = safeYMD(start);
  const b = safeYMD(end);
  if (!a || !b) return "";
  return `${a} → ${b}`;
}

export default function ConfirmBookingPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { token } = useAuth();

  const agencyTourId = sp.get("agencyTourId");
  const dateFromUrl = sp.get("date") || "";

  const redirectTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [travelers, setTravelers] = useState("1");
  const [notes, setNotes] = useState("");
  const [selectedDateLabel, setSelectedDateLabel] = useState(dateFromUrl);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });

    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2200);
  };

  const redirectWithToast = (type, message, path, delay = 1000) => {
    showToast(type, message);
    window.clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = window.setTimeout(() => {
      navigate(path);
    }, delay);
  };

  const availableDates = useMemo(() => {
    if (!preview) return [];

    const rangeLabel = makeRangeLabel(preview.start_date, preview.end_date);
    if (rangeLabel) return [rangeLabel];

    const parsed = parsePipeRange(preview.available_dates);
    const legacyLabel = makeRangeLabel(parsed.start, parsed.end);
    if (legacyLabel) return [legacyLabel];

    return normalizeCsvDates(preview.available_dates);
  }, [preview]);

  const unitPrice = useMemo(() => Number(preview?.price || 0), [preview]);

  const totalPrice = useMemo(() => {
    const n = Number(String(travelers || "1").trim());
    return unitPrice * (Number.isNaN(n) ? 1 : n);
  }, [unitPrice, travelers]);

  const unitPriceText = useMemo(
    () => `NPR ${unitPrice.toLocaleString("en-NP")}`,
    [unitPrice]
  );

  const totalPriceText = useMemo(
    () => `NPR ${totalPrice.toLocaleString("en-NP")}`,
    [totalPrice]
  );

  useEffect(() => {
    if (!preview) return;

    if (dateFromUrl && availableDates.includes(dateFromUrl)) {
      setSelectedDateLabel(dateFromUrl);
      return;
    }

    if (!selectedDateLabel && availableDates.length > 0) {
      setSelectedDateLabel(availableDates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, dateFromUrl, availableDates.length]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!token) {
          redirectWithToast("error", "Please login to continue booking.", "/login");
          return;
        }

        if (!agencyTourId) {
          redirectWithToast(
            "error",
            "Missing agency tour info. Please try again.",
            "/tours"
          );
          return;
        }

        const res = await fetchBookingPreview(agencyTourId);
        setPreview(res?.data || null);
      } catch (e) {
        console.error("Failed to load booking preview", e);
        redirectWithToast(
          "error",
          e?.response?.data?.message || "Failed to load booking preview.",
          "/tours"
        );
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      window.clearTimeout(redirectTimerRef.current);
      window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, agencyTourId]);

  const handleConfirm = async () => {
    if (!selectedDateLabel) {
      showToast("error", "Please select a date first.");
      return;
    }

    const n = Number(String(travelers || "1").trim());
    if (!n || Number.isNaN(n) || n < 1 || n > 99) {
      showToast("error", "Travelers must be between 1 and 99.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        agencyTourId: Number(agencyTourId),
        travelers: n,
        notes: notes?.trim() || null,
        selectedDateLabel,
      };

      const res = await createBooking(payload);
      const saved = res?.data || {};

      redirectWithToast(
        "success",
        `Booking confirmed. Ref: ${saved?.ref_code || "-"} | Travelers: ${
          saved?.travelers ?? "-"
        }`,
        "/bookings",
        1200
      );
    } catch (e) {
      console.error("Confirm booking failed", e);
      showToast("error", e?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Confirm Your Booking
            </h1>
          </div>

          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            {loading ? (
              <div className="text-sm text-gray-500">Loading booking details...</div>
            ) : !preview ? (
              <div className="text-sm text-red-600">Preview not found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <div className="text-xs text-gray-600 font-semibold">Tour Name</div>
                  <div className="mt-1 font-semibold text-gray-900">{preview.tour_title}</div>
                </div>

                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <div className="text-xs text-gray-600 font-semibold">Selected Agency</div>
                  <div className="mt-1 font-semibold text-gray-900">{preview.agency_name}</div>
                </div>

                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <div className="text-xs text-gray-600 font-semibold">Price (per person)</div>
                  <div className="mt-1 font-semibold text-gray-900">{unitPriceText}</div>
                </div>

                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <div className="text-xs text-gray-600 font-semibold">Total</div>
                  <div className="mt-1 font-semibold text-gray-900">{totalPriceText}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-900">Select date</label>

                {availableDates.length === 0 ? (
                  <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    No dates available yet.
                  </div>
                ) : (
                  <select
                    value={selectedDateLabel}
                    onChange={(e) => setSelectedDateLabel(e.target.value)}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                  >
                    {availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Choose the available period provided by the agency.
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Number of travelers
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <div className="text-xs text-gray-500 mt-2">
                  Total travelers in your group.
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900">
                  Additional notes (optional)
                </label>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Simple note."
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-gray-500">
                  After confirmation, your booking status will be set to{" "}
                  <span className="font-semibold text-gray-700">Pending</span>.
                </div>

                <button
                  disabled={
                    saving ||
                    loading ||
                    !preview ||
                    !selectedDateLabel ||
                    availableDates.length === 0
                  }
                  onClick={handleConfirm}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold ${
                    saving ||
                    loading ||
                    !preview ||
                    !selectedDateLabel ||
                    availableDates.length === 0
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  <FaCheckCircle />
                  {saving ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterTourist />

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}