// client/src/pages/admin/AdminForgotPasswordPage.jsx
import { useMemo, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import AdminAuthLayout from "../../components/admin/AdminAuthLayout";

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");

  const passwordRules = useMemo(
    () => [
      { test: /.{8,}/, message: "At least 8 characters" },
      { test: /[A-Z]/, message: "At least one uppercase letter (A-Z)" },
      { test: /[a-z]/, message: "At least one lowercase letter (a-z)" },
      { test: /[0-9]/, message: "At least one number (0-9)" },
      {
        test: /[^A-Za-z0-9]/,
        message: "At least one special character (!@#$, etc.)",
      },
    ],
    []
  );

  const passwordChecks = passwordRules.map((rule) => ({
    message: rule.message,
    ok: rule.test.test(password),
  }));

  const missingPasswordRules = passwordChecks
    .filter((c) => !c.ok)
    .map((c) => c.message);

  const isPasswordStrong = missingPasswordRules.length === 0;

  const clearAllMessages = () => {
    if (error) setError("");
    if (errors.length) setErrors([]);
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Both fields are required.");
      setErrors([]);
      setSuccess("");
      return;
    }

    if (!isPasswordStrong) {
      setError("Password is too weak. Please fix the following:");
      setErrors(missingPasswordRules);
      setSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setErrors([]);
      setSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setErrors([]);
      setSuccess("");

      const { data } = await apiClient.post("/admin/auth/reset-password", {
        password,
        confirmPassword,
      });

      setSuccess(data?.message || "Admin password reset successfully.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to reset admin password. Please try again.";
      const apiErrors = err?.response?.data?.errors;

      setError(msg);
      setErrors(Array.isArray(apiErrors) ? apiErrors : []);
      setSuccess("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminAuthLayout>
      <div className="w-full max-w-[510px] rounded-2xl bg-white/80 border border-[#d9e6dd] shadow-sm px-6 py-7 md:px-8 md:py-8">
        <h1 className="text-[24px] md:text-[26px] font-semibold text-[#1a2f28]">
          Reset Admin Password
        </h1>

        <p className="mt-2 text-[14px] text-gray-600">
          Set a new password for the admin account.
        </p>

        {(error || errors.length > 0) && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error ? <div className="font-medium">{error}</div> : null}

            {errors.length > 0 && (
              <ul className="mt-1 list-disc pl-5 space-y-0.5 text-xs">
                {errors.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {success && (
          <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              New Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearAllMessages();
                }}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter new password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-[11px] text-gray-600 mb-1">Must include:</p>
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Confirm New Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearAllMessages();
                }}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Re-enter new password"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-[11px] text-red-600">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#04753d] text-white text-sm font-semibold hover:bg-[#046736] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            className="w-full h-11 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Login
          </button>
        </form>
      </div>
    </AdminAuthLayout>
  );
}