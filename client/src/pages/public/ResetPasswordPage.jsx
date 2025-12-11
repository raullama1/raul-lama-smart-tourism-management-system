// client/src/pages/public/ResetPasswordPage.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/authApi";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Same password rules as signup
  const passwordRules = [
    { test: /.{8,}/, message: "At least 8 characters" },
    { test: /[A-Z]/, message: "At least one uppercase letter (A-Z)" },
    { test: /[a-z]/, message: "At least one lowercase letter (a-z)" },
    { test: /[0-9]/, message: "At least one number (0-9)" },
    {
      test: /[^A-Za-z0-9]/,
      message: "At least one special character (!@#$, etc.)",
    },
  ];

  const passwordChecks = passwordRules.map((rule) => ({
    message: rule.message,
    ok: rule.test.test(password),
  }));

  const isPasswordStrong = passwordChecks.every((c) => c.ok);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (!isPasswordStrong) {
      setError("Password is too weak. Please follow all the rules below.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const res = await resetPassword(token, password);
      setMessage(res.message || "Password reset successful.");

      // auto redirect after 1s
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error("Reset password error", err);
      const msg =
        err?.response?.data?.message ||
        "Failed to reset password. Try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const clearErrorOnChange = () => {
    if (error) setError("");
  };

  return (
    <main className="min-h-screen bg-[#e6f4ec] flex items-center justify-center py-10">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-2">
            Set a new password
          </h1>
          <p className="text-xs md:text-sm text-gray-500 text-center mb-4 md:mb-6">
            Choose a strong new password for your account.
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
            {/* New password */}
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearErrorOnChange();
                  }}
                  className="w-full h-10 md:h-11 px-3 pr-10 rounded-xl border border-gray-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {/* Password hints */}
              <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-[11px] text-gray-600 mb-1">
                  Use a strong password that includes:
                </p>
                <ul className="space-y-1">
                  {passwordChecks.map((rule, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-1 text-[11px] ${
                        rule.ok ? "text-emerald-700" : "text-gray-500"
                      }`}
                    >
                      <span>{rule.ok ? "✔" : "•"}</span>
                      <span>{rule.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearErrorOnChange();
                  }}
                  className="w-full h-10 md:h-11 px-3 pr-10 rounded-xl border border-gray-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 md:h-11 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-semibold shadow-md hover:scale-[1.02] active:scale-100 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating password..." : "Update password"}
            </button>
          </form>

          <p className="mt-4 text-[11px] md:text-xs text-gray-600 text-center">
            Back to{" "}
            <Link
              to="/login"
              className="text-emerald-700 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
