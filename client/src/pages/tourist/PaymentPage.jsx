// client/src/pages/tourist/PaymentPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings } from "../../api/bookingApi";
import { initiateEsewaPayment } from "../../api/paymentApi";
import {
  FaCheck,
  FaArrowRight,
  FaWallet,
  FaInfoCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

export default function PaymentPage() {
  const { bookingId } = useParams(); // booking id from route param
  const navigate = useNavigate();
  const { token } = useAuth(); // used to ensure user is logged in

  const [row, setRow] = useState(null); // selected booking row
  const [loading, setLoading] = useState(true); // page loading state
  const [paying, setPaying] = useState(false); // prevents double click payment

  const [esewa, setEsewa] = useState(null); // { esewaUrl, formData } from backend
  const formRef = useRef(null); // hidden form ref (auto-submit to eSewa)

  // show total price nicely
  const totalText = useMemo(() => {
    const n = Number(row?.total_price || 0);
    return `NPR ${n.toLocaleString()}`;
  }, [row]);

  // payment allowed only if Approved + Unpaid
  const canPay = useMemo(() => {
    if (!row) return false;
    return row.booking_status === "Approved" && row.payment_status === "Unpaid";
  }, [row]);

  // header pill + message based on booking status
  const statusUI = useMemo(() => {
    const s = row?.booking_status;

    if (!row) {
      return {
        pill: "bg-gray-700 text-white",
        icon: <FaInfoCircle />,
        title: "Payment",
        subtitle: "Loading booking status...",
        note: "",
      };
    }

    if (row.payment_status === "Paid") {
      return {
        pill: "bg-emerald-700 text-white",
        icon: <FaCheck />,
        title: "Paid",
        subtitle: "Payment already completed.",
        note: "You can go back to Bookings.",
      };
    }

    if (s === "Approved") {
      return {
        pill: "bg-emerald-700 text-white",
        icon: <FaCheck />,
        title: "Approved",
        subtitle: "Ready for payment",
        note: "Complete payment to confirm your booking.",
      };
    }

    if (s === "Pending") {
      return {
        pill: "bg-amber-500 text-white",
        icon: <FaClock />,
        title: "Pending",
        subtitle: "Waiting for agency approval",
        note: "Payment will unlock after approval.",
      };
    }

    if (s === "Cancelled") {
      return {
        pill: "bg-gray-500 text-white",
        icon: <FaTimesCircle />,
        title: "Cancelled",
        subtitle: "This booking was cancelled",
        note: "You can’t pay for a cancelled booking.",
      };
    }

    return {
      pill: "bg-indigo-600 text-white",
      icon: <FaInfoCircle />,
      title: s || "Status",
      subtitle: "Payment not available yet",
      note: "Please check booking status.",
    };
  }, [row]);

  // load booking details by reusing /bookings list and finding the matching id
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // redirect to login if user is not logged in
        if (!token) {
          navigate("/login");
          return;
        }

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

  // once we get eSewa payload, auto-submit hidden form to redirect user
  useEffect(() => {
    if (esewa?.esewaUrl && esewa?.formData && formRef.current) {
      formRef.current.submit();
    }
  }, [esewa]);

  // start payment by requesting eSewa payload from backend
  const handlePay = async () => {
    if (!row) return;

    // show user-friendly message if payment is not allowed
    if (!canPay) {
      if (row.payment_status === "Paid") return alert("This booking is already paid.");
      if (row.booking_status !== "Approved") {
        return alert("Payment is locked until the agency approves your booking.");
      }
      return alert("Payment is not available right now.");
    }

    if (paying) return;

    try {
      setPaying(true);

      const res = await initiateEsewaPayment(Number(bookingId));
      const payload = res?.data;

      // backend must return esewaUrl + formData to proceed
      if (!payload?.esewaUrl || !payload?.formData) {
        alert("Failed to start eSewa payment. Please try again.");
        return;
      }

      setEsewa(payload);
    } catch (e) {
      console.error("Initiate eSewa failed:", e);
      alert(e?.response?.data?.message || "Failed to start payment.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Page header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">
              Payment
            </h1>

            {/* Status strip */}
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold",
                    statusUI.pill,
                  ].join(" ")}
                >
                  {statusUI.icon} {statusUI.title}
                </span>

                <span className="text-emerald-800 font-semibold text-sm">
                  {statusUI.subtitle}
                </span>
              </div>

              <div className="text-sm text-emerald-700">{statusUI.note}</div>
            </div>
          </div>

          {/* Main content */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Booking summary */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Booking Summary
              </h2>

              {loading ? (
                <div className="mt-4 text-sm text-gray-500">Loading...</div>
              ) : !row ? (
                <div className="mt-4 text-sm text-red-600">Booking not found.</div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">Tour</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.tour_title}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">Agency</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.agency_name}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">Date</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.selected_date_label || "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="text-xs text-gray-600 font-semibold">Travelers</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {row.travelers || 1}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">Total Price</div>
                    <div className="text-lg font-bold text-gray-900">{totalText}</div>
                  </div>

                  <div className="mt-2 text-sm text-emerald-700">
                    Review details before paying.
                  </div>
                </>
              )}
            </div>

            {/* Right: Payment method */}
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
                      <div className="font-semibold text-gray-900">Pay with eSewa</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-700">Selected</div>
                </div>
              </div>

              {/* Show warning when payment is locked */}
              {!loading && row && !canPay && row.payment_status !== "Paid" && (
                <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                  Payment is locked until the agency approves your booking.
                </div>
              )}

              <button
                disabled={!canPay || paying}
                onClick={handlePay}
                className={[
                  "mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold transition-all",
                  !canPay || paying
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-emerald-700 hover:bg-emerald-800 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-sm",
                ].join(" ")}
              >
                {paying ? "Redirecting..." : "Pay with eSewa"} <FaArrowRight />
              </button>

              <div className="mt-3 text-sm text-gray-600">
                Proceed to complete the payment process.
              </div>

              {/* Note: success/failure pages will show the final result after redirect */}
            </div>
          </div>

          {/* Back button */}
          <div className="mt-5">
            <button
              onClick={() => navigate("/bookings")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>

        {/* Hidden form that posts payment data to eSewa */}
        {esewa?.esewaUrl && esewa?.formData && (
          <form
            ref={formRef}
            action={esewa.esewaUrl}
            method="POST"
            className="hidden"
          >
            {Object.entries(esewa.formData).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={String(v)} readOnly />
            ))}
          </form>
        )}
      </main>

      <FooterTourist />
    </>
  );
}
