// client/src/router/AppRouter.js
import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

import PublicHomePage from "../pages/public/PublicHomePage";
import PublicToursPage from "../pages/public/PublicToursPage";
import PublicTourDetailsPage from "../pages/public/PublicTourDetailsPage";
import PublicBlogsPage from "../pages/public/PublicBlogsPage";
import PublicBlogDetailsPage from "../pages/public/PublicBlogDetailsPage";

import LoginPage from "../pages/public/LoginPage";
import SignupPage from "../pages/public/SignupPage";
import ForgotPasswordPage from "../pages/public/ForgotPasswordPage";
import ResetPasswordPage from "../pages/public/ResetPasswordPage";

import TouristHomePage from "../pages/tourist/TouristHomePage";
import TouristNepalMapPage from "../pages/tourist/TouristNepalMapPage";
import WishlistPage from "../pages/tourist/WishlistPage";
import BookingsPage from "../pages/tourist/BookingsPage";
import ConfirmBookingPage from "../pages/tourist/ConfirmBookingPage";
import PaymentPage from "../pages/tourist/PaymentPage";
import PaymentSuccessPage from "../pages/tourist/PaymentSuccessPage";
import PaymentFailurePage from "../pages/tourist/PaymentFailurePage";

import { useAuth } from "../context/AuthContext";

/* Protect private routes */
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/* Redirect logged-in users away from public pages */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* "/" smart redirect */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <PublicHomePage />
            </PublicRoute>
          }
        />

        {/* Public pages */}
        <Route path="/tours" element={<PublicToursPage />} />
        <Route path="/tours/:tourId" element={<PublicTourDetailsPage />} />
        <Route path="/blogs" element={<PublicBlogsPage />} />
        <Route path="/blogs/:blogId" element={<PublicBlogDetailsPage />} />

        <Route
          path="/public"
          element={
            <PublicRoute>
              <PublicHomePage />
            </PublicRoute>
          }
        />

        {/* Auth */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Tourist private pages */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <TouristHomePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/map"
          element={
            <PrivateRoute>
              <TouristNepalMapPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <PrivateRoute>
              <WishlistPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <PrivateRoute>
              <BookingsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/bookings/confirm"
          element={
            <PrivateRoute>
              <ConfirmBookingPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/payment/:bookingId"
          element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          }
        />

        {/* Payment result pages */}
        <Route
          path="/payment/success/:bookingId"
          element={
            <PrivateRoute>
              <PaymentSuccessPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment/failure/:bookingId"
          element={
            <PrivateRoute>
              <PaymentFailurePage />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
