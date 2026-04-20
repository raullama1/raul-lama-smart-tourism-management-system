// client/src/pages/tourist/PaymentFailurePage.jsx
import { useNavigate, useParams } from "react-router-dom";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { FaTimesCircle } from "react-icons/fa";

export default function PaymentFailurePage() {
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

          <main className="flex min-h-[calc(100vh-80px)] items-center justify-center">
            <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
                    <FaTimesCircle className="text-xl" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Payment Failed
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Payment was cancelled or not completed. No confirmation was made.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Booking ID: <span className="font-semibold">#{bookingId}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2">

                  <button
                    onClick={() => navigate("/bookings")}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                  >
                    Back to Bookings
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