// client/src/pages/agency/AgencyForgotPasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import AgencyAuthLayout from "../../components/agency/AgencyAuthLayout";
import { agencyRequestPasswordReset } from "../../api/agencyAuthApi";

export default function AgencyForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const res = await agencyRequestPasswordReset(trimmed);
      setMessage(res?.message || "If an account exists, a reset link has been sent.");
    } catch (err) {
      console.error("Agency forgot password error", err);
      const msg = err?.response?.data?.message || "Failed to send reset link. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthLayout>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
        <h1 className="text-xl font-semibold text-gray-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email address and we&apos;ll send you a reset link.
        </p>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending link..." : "Send reset link"}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Remember your password?{" "}
            <Link to="/agency/login" className="font-semibold text-gray-900 hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </AgencyAuthLayout>
  );
}
