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
import WriteReviewPage from "../pages/tourist/WriteReviewPage";
import TouristChatPage from "../pages/tourist/TouristChatPage";
import TouristProfilePage from "../pages/tourist/TouristProfilePage";

import { useAuth } from "../context/AuthContext";
import { useAgencyAuth } from "../context/AgencyAuthContext";

import AgencyLoginPage from "../pages/agency/AgencyLoginPage";
import AgencyRegisterPage from "../pages/agency/AgencyRegisterPage";
import AgencyHelpPage from "../pages/agency/AgencyHelpPage";
import AgencyForgotPasswordPage from "../pages/agency/AgencyForgotPasswordPage";
import AgencyResetPasswordPage from "../pages/agency/AgencyResetPasswordPage";
import AgencyDashboardPage from "../pages/agency/AgencyDashboardPage";
import AgencyAddTourPage from "../pages/agency/AgencyAddTourPage";
import AgencyManageToursPage from "../pages/agency/AgencyManageToursPage";
import AgencyAddExistingTourPage from "../pages/agency/AgencyAddExistingTourPage";
import AgencyBookingsPage from "../pages/agency/AgencyBookingsPage";
import AgencyBookingDetailsPage from "../pages/agency/AgencyBookingDetailsPage";

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

function AgencyPrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAgencyAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/agency/login" replace />;
}

function AgencyPublicRoute({ children }) {
  const { isAuthenticated, loading } = useAgencyAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/agency/dashboard" replace />
  ) : (
    children
  );
}

function AgencyIndexRedirect() {
  const { isAuthenticated, loading } = useAgencyAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/agency/dashboard" replace />
  ) : (
    <Navigate to="/agency/login" replace />
  );
}

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <PublicHomePage />
            </PublicRoute>
          }
        />

        {/* Public */}
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

        {/* Tourist Auth */}
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

        {/* Tourist */}
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
        <Route
          path="/review/:bookingId"
          element={
            <PrivateRoute>
              <WriteReviewPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/review"
          element={
            <PrivateRoute>
              <WriteReviewPage />
            </PrivateRoute>
          }
        />

        {/* Chat */}
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <TouristChatPage />
            </PrivateRoute>
          }
        />

        {/* Tourist Profile */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <TouristProfilePage />
            </PrivateRoute>
          }
        />

        {/* Agency Portal Base */}
        <Route path="/agency" element={<AgencyIndexRedirect />} />

        {/* Agency Auth Pages */}
        <Route
          path="/agency/login"
          element={
            <AgencyPublicRoute>
              <AgencyLoginPage />
            </AgencyPublicRoute>
          }
        />
        <Route
          path="/agency/register"
          element={
            <AgencyPublicRoute>
              <AgencyRegisterPage />
            </AgencyPublicRoute>
          }
        />
        <Route
          path="/agency/help"
          element={
            <AgencyPublicRoute>
              <AgencyHelpPage />
            </AgencyPublicRoute>
          }
        />
        <Route
          path="/agency/forgot-password"
          element={
            <AgencyPublicRoute>
              <AgencyForgotPasswordPage />
            </AgencyPublicRoute>
          }
        />
        <Route
          path="/agency/reset-password"
          element={
            <AgencyPublicRoute>
              <AgencyResetPasswordPage />
            </AgencyPublicRoute>
          }
        />

        {/* ✅ Protected Agency Routes */}
        <Route
          path="/agency/dashboard"
          element={
            <AgencyPrivateRoute>
              <AgencyDashboardPage />
            </AgencyPrivateRoute>
          }
        />

        <Route
          path="/agency/tours/existing"
          element={
            <AgencyPrivateRoute>
              <AgencyAddExistingTourPage />
            </AgencyPrivateRoute>
          }
        />

        <Route
          path="/agency/tours/new"
          element={
            <AgencyPrivateRoute>
              <AgencyAddTourPage />
            </AgencyPrivateRoute>
          }
        />

        <Route
          path="/agency/tours/manage"
          element={
            <AgencyPrivateRoute>
              <AgencyManageToursPage />
            </AgencyPrivateRoute>
          }
        />

        <Route
          path="/agency/bookings"
          element={
            <AgencyPrivateRoute>
              <AgencyBookingsPage />
            </AgencyPrivateRoute>
          }
        />

        {/* Booking Details */}
        <Route
          path="/agency/bookings/:bookingId"
          element={
            <AgencyPrivateRoute>
              <AgencyBookingDetailsPage />
            </AgencyPrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}