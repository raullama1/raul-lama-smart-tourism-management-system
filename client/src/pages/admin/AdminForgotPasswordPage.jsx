// client/src/pages/admin/AdminForgotPasswordPage.jsx
import { useMemo, useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiShield,
  FiLock,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
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
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

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
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-[580px] overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.88))]" />
        <div className="absolute -left-16 top-10 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative px-6 py-7 sm:px-8 sm:py-8 md:px-10 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                <FiShield size={13} />
                Admin Security
              </div>
              <h1 className="mt-4 text-[28px] font-black tracking-tight text-slate-900 md:text-[32px]">
                Reset Admin Password
              </h1>
              <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500 md:text-[15px]">
                Create a new secure password for the admin account and continue to login.
              </p>
            </div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/70 bg-white/70 text-emerald-700 shadow-lg backdrop-blur md:flex"
            >
              <FiLock size={28} />
            </motion.div>
          </div>

          <AnimatePresence>
            {(error || errors.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error ? <div className="font-medium">{error}</div> : null}

                {errors.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-5 text-xs">
                    {errors.map((item, idx) => (
                      <li key={idx} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-600 md:text-[15px]">
                New Password
              </label>

              <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-600">
                  <FiLock size={18} />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearAllMessages();
                  }}
                  placeholder="Enter new password"
                  className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-12 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Password Rules
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {passwordChecks.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                        rule.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <span className="shrink-0">
                        {rule.ok ? <FiCheckCircle size={14} /> : "•"}
                      </span>
                      <span>{rule.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-600 md:text-[15px]">
                Confirm New Password
              </label>

              <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-600">
                  <FiLock size={18} />
                </span>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearAllMessages();
                  }}
                  placeholder="Re-enter new password"
                  className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-12 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {confirmPassword.length > 0 && password !== confirmPassword ? (
                <p className="text-xs font-medium text-red-600">
                  Passwords do not match.
                </p>
              ) : null}

              {passwordsMatch ? (
                <p className="text-xs font-medium text-emerald-700">
                  Passwords match.
                </p>
              ) : null}
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={submitting}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-500 text-[15px] font-semibold text-white shadow-[0_16px_40px_rgba(5,150,105,0.28)] transition hover:from-emerald-700 hover:via-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update Password"}
            </motion.button>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => navigate("/admin/login")}
              className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FiArrowLeft size={17} />
              Back to Login
            </motion.button>
          </form>
        </div>
      </motion.div>
    </AdminAuthLayout>
  );
}