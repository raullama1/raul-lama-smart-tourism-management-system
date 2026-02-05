import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchBookingPreview, createBooking } from "../../api/bookingApi";
import { FaCheckCircle } from "react-icons/fa";

export default function ConfirmBookingPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { token } = useAuth();

  const agencyTourId = sp.get("agencyTourId");

  // date from URL (optional)
  const dateFromUrl = sp.get("date") || "";

  const [preview, setPreview] = useState(null);

  // ✅ default 1 traveler
  const [travelers, setTravelers] = useState(1);

  const [notes, setNotes] = useState("");

  // ✅ user selectable date
  const [selectedDateLabel, setSelectedDateLabel] = useState(dateFromUrl);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const normalizeDates = (csv) => {
    if (!csv) return [];
    return csv
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
  };

  // ✅ dates from preview (must come from backend)
  const availableDates = useMemo(() => {
    return normalizeDates(preview?.available_dates);
  }, [preview]);

  // ✅ auto-pick first date if none selected and dates exist
  useEffect(() => {
    if (!preview) return;

    // if URL date exists and is valid -> keep it
    if (dateFromUrl && availableDates.includes(dateFromUrl)) {
      setSelectedDateLabel(dateFromUrl);
      return;
    }

    // if not selected -> choose first available date
    if (!selectedDateLabel && availableDates.length > 0) {
      setSelectedDateLabel(availableDates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, dateFromUrl, availableDates.length]);

  // ✅ unit price
  const unitPrice = useMemo(() => Number(preview?.price || 0), [preview]);

  // ✅ total = unit * travelers
  const totalPrice = useMemo(() => {
    const n = Number(travelers || 1);
    return unitPrice * (Number.isNaN(n) ? 1 : n);
  }, [unitPrice, travelers]);

  const unitPriceText = useMemo(() => {
    return `NPR ${unitPrice.toLocaleString()}`;
  }, [unitPrice]);

  const totalPriceText = useMemo(() => {
    return `NPR ${totalPrice.toLocaleString()}`;
  }, [totalPrice]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!token) {
          alert("Please login to continue booking.");
          navigate("/login");
          return;
        }

        if (!agencyTourId) {
          alert("Missing agency tour info. Please try again.");
          navigate("/tours");
          return;
        }

        // ✅ token handled by apiClient interceptor
        const res = await fetchBookingPreview(agencyTourId);
        setPreview(res?.data || null);
      } catch (e) {
        console.error("Failed to load booking preview", e);
        alert(e?.response?.data?.message || "Failed to load booking preview.");
        navigate("/tours");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, agencyTourId]);

  const handleConfirm = async () => {
    if (!selectedDateLabel) {
      alert("Please select a date first.");
      return;
    }

    const n = Number(travelers);
    if (!n || n < 1 || n > 99) {
      alert("Travelers must be between 1 and 99.");
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

      alert(`Booking confirmed ✅\nRef: ${res?.data?.ref_code || "-"}`);
      navigate("/bookings");
    } catch (e) {
      console.error("Confirm booking failed", e);
      alert(e?.response?.data?.message || "Booking failed. Please try again.");
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

          {/* Summary */}
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

          {/* Form */}
          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="space-y-4">
              {/* ✅ Date select */}
              <div>
                <label className="text-sm font-semibold text-gray-900">Select date</label>

                {availableDates.length === 0 ? (
                  <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    No dates available yet. (Agency has not added dates.)
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
                  Choose one available date from the agency.
                </div>
              </div>

              {/* Travelers */}
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

              {/* Notes */}
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
                    saving || loading || !preview || !selectedDateLabel || availableDates.length === 0
                  }
                  onClick={handleConfirm}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold
                    ${
                      saving || loading || !preview || !selectedDateLabel || availableDates.length === 0
                        ? "bg-emerald-300 cursor-not-allowed"
                        : "bg-emerald-700 hover:bg-emerald-800"
                    }
                  `}
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
    </>
  );
}
