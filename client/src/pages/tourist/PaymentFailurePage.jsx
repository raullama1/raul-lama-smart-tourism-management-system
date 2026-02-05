// client/src/pages/tourist/PaymentFailurePage.jsx
import { useNavigate, useParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { FaTimesCircle } from "react-icons/fa";

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#e6f4ec] min-h-screen pt-10 pb-10">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <FaTimesCircle className="text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Payment Failed
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Payment was cancelled or not completed. No confirmation was made.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Booking ID: <span className="font-semibold">#{bookingId}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => navigate(`/payment/${bookingId}`)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
              >
                Try Again
              </button>

              <button
                onClick={() => navigate("/bookings")}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </main>

      <FooterTourist />
    </>
  );
}
