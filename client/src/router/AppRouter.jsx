import { Routes, Route } from "react-router-dom";
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

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />  {/* Always on top when navigating */}

      <Routes>
      {/* Public site */}
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/tours" element={<PublicToursPage />} />
      <Route path="/tours/:tourId" element={<PublicTourDetailsPage />} />
      <Route path="/blogs" element={<PublicBlogsPage />} />
      <Route path="/blogs/:blogId" element={<PublicBlogDetailsPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </>
  );
}
