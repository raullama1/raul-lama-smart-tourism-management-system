// client/src/pages/agency/AgencyResetPasswordPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import AgencyAuthLayout from "../../components/agency/AgencyAuthLayout";
import { agencyResetPassword } from "../../api/agencyAuthApi";

export default function AgencyResetPasswordPage() {
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
  const [errors, setErrors] = useState([]);

  const passwordRules = useMemo(
    () => [
      { test: /.{8,}/, message: "At least 8 characters" },
      { test: /[A-Z]/, message: "At least one uppercase letter (A-Z)" },
      { test: /[a-z]/, message: "At least one lowercase letter (a-z)" },
      { test: /[0-9]/, message: "At least one number (0-9)" },
      { test: /[^A-Za-z0-9]/, message: "At least one special character (!@#$, etc.)" },
    ],
    []
  );

  const passwordChecks = passwordRules.map((rule) => ({
    message: rule.message,
    ok: rule.test.test(password),
  }));

  const missingPasswordRules = passwordChecks.filter((c) => !c.ok).map((c) => c.message);
  const isPasswordStrong = missingPasswordRules.length === 0;

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
      setErrors([]);
    }
  }, [token]);

  const clearAllErrors = () => {
    if (error) setError("");
    if (errors.length) setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid or missing reset token.");
      setErrors([]);
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      setErrors([]);
      return;
    }

    if (!isPasswordStrong) {
      setError("Password is too weak. Please fix the following:");
      setErrors(missingPasswordRules);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      setErrors([]);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setErrors([]);
      setMessage("");

      const res = await agencyResetPassword(token, password);
      setMessage(res?.message || "Password reset successful.");

      setTimeout(() => navigate("/agency/login"), 1000);
    } catch (err) {
      console.error("Agency reset password error", err);
      const msg = err?.response?.data?.message || "Failed to reset password. Try again.";
      const apiErrors = err?.response?.data?.errors;

      setError(msg);
      setErrors(Array.isArray(apiErrors) ? apiErrors : []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthLayout>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
        <h1 className="text-xl font-semibold text-gray-900">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a strong new password for your agency account.
        </p>

        {(error || errors.length > 0) && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error ? <div className="font-medium">{error}</div> : null}
            {errors.length > 0 && (
              <ul className="mt-1 list-disc pl-5 space-y-0.5 text-xs">
                {errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {message && (
          <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearAllErrors();
                }}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-600 mb-1">Must include:</p>
              <ul className="space-y-1">
                {passwordChecks.map((rule, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-1 text-xs ${
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearAllErrors();
                }}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating password..." : "Update password"}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Back to{" "}
            <Link to="/agency/login" className="font-semibold text-gray-900 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </AgencyAuthLayout>
  );
}
