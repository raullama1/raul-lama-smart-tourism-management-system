// client/src/pages/tourist/PaymentSuccessPage.jsx
import { useNavigate, useParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { FaCheckCircle } from "react-icons/fa";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  return (
    <div className="relative bg-[#071510]">
      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <FooterTourist />
        </div>

        <div className="relative z-10 bg-[#e6f4ec]">
          <NavbarTourist />

          <main className="min-h-screen pt-10 pb-10">
            <div className="max-w-3xl mx-auto px-4 md:px-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                    <FaCheckCircle className="text-xl" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Payment Successful
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Your payment was received. Booking is now confirmed.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Booking ID: <span className="font-semibold">#{bookingId}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => navigate("/bookings")}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                  >
                    Go to Bookings
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>
    </div>
  );
}