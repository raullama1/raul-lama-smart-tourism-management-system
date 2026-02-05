// client/src/pages/tourist/PaymentPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings } from "../../api/bookingApi";
import { FaCheck, FaArrowRight, FaWallet, FaInfoCircle } from "react-icons/fa";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Summary text
  const totalText = useMemo(() => {
    const n = Number(row?.total_price || 0);
    return `NPR ${n.toLocaleString()}`;
  }, [row]);

  const canPay = useMemo(() => {
    if (!row) return false;
    // In your design payment is enabled when booking is Approved and still Unpaid
    return row.booking_status === "Approved" && row.payment_status === "Unpaid";
  }, [row]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!token) {
          navigate("/login");
          return;
        }

        // UI-first: we reuse existing /bookings list and find the booking by id
        const res = await fetchMyBookings({});
        const list = res?.data || [];
        const found = list.find((x) => String(x.id) === String(bookingId));

        setRow(found || null);
      } catch (e) {
        console.error("Payment page load failed:", e);
        setRow(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, bookingId, navigate]);

  const handlePay = () => {
    // UI-first only (Screen 14 logic later)
    alert("Khalti integration will be added in Screen 14 backend step 🙂");
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Payment
            </h1>

            {/* Status Bar */}
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold">
                  <FaCheck /> Approved
                </span>
                <span className="text-emerald-800 font-semibold text-sm">
                  Ready for Payment
                </span>
              </div>

              <div className="text-sm text-emerald-700">
                Your booking is approved. Complete payment to confirm.
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Booking Summary */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Booking Summary
              </h2>

              {loading ? (
                <div className="mt-4 text-sm text-gray-500">Loading...</div>
              ) : !row ? (
                <div className="mt-4 text-sm text-red-600">
                  Booking not found.
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">
                        Tour
                      </div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.tour_title}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">
                        Agency
                      </div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.agency_name}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">
                        Dates
                      </div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.selected_date_label || "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">
                        Travelers
                      </div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.travelers || 1}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">
                      Total Price
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {totalText}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-emerald-700">
                    Review details before paying. Taxes included.
                  </div>
                </>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Payment Method
              </h2>

              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-700">
                      <FaWallet />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Pay with Khalti
                      </div>
                      <div className="text-sm text-emerald-700">
                        Secure digital wallet payment. Single-step checkout.
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-emerald-700">
                    Selected
                  </div>
                </div>
              </div>

              <button
                disabled={!canPay}
                onClick={handlePay}
                className={[
                  "mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold transition-all",
                  canPay
                    ? "bg-emerald-700 hover:bg-emerald-800 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-sm"
                    : "bg-emerald-300 cursor-not-allowed",
                ].join(" ")}
              >
                Pay with Khalti <FaArrowRight />
              </button>

              <div className="mt-3 text-sm text-gray-600">
                By proceeding, you agree to the terms and authorize the payment.
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex gap-3">
                <div className="text-emerald-700 mt-0.5">
                  <FaInfoCircle />
                </div>
                <div className="text-sm text-emerald-800">
                  On successful payment: Status updates to{" "}
                  <span className="font-semibold">Confirmed</span> and
                  notifications will be sent to the Tourist & Agency.
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="mt-5">
            <button
              onClick={() => navigate("/bookings")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}
