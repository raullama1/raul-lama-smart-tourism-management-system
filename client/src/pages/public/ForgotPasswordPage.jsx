// client/src/pages/public/ForgotPasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const res = await requestPasswordReset(email);
      setMessage(res.message || "If an account exists, a reset link has been sent.");
    } catch (err) {
      console.error("Forgot password error", err);
      setError("Failed to send reset link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e6f4ec] flex items-center justify-center py-10">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-2">
            Forgot password?
          </h1>
          <p className="text-xs md:text-sm text-gray-500 text-center mb-4 md:mb-6">
            Enter your email address and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="mb-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-3 text-xs md:text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="w-full h-10 md:h-11 px-3 rounded-xl border border-gray-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 md:h-11 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-semibold shadow-md hover:scale-[1.02] active:scale-100 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending link..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-4 text-[11px] md:text-xs text-gray-600 text-center">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-emerald-700 font-medium hover:underline"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
