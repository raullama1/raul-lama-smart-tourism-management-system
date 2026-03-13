// client/src/pages/public/ResetPasswordPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { resetPassword } from "../../api/authApi";
import { FiEye, FiEyeOff } from "react-icons/fi";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);

  const fieldClassName = useMemo(
    () =>
      "w-full h-10 md:h-11 px-3 rounded-xl border border-gray-300 text-xs md:text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
    []
  );

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

      const res = await resetPassword(token, password);
      setMessage(res.message || "Password reset successful.");

      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error("Reset password error", err);

      const msg =
        err?.response?.data?.message || "Failed to reset password. Try again.";
      const apiErrors = err?.response?.data?.errors;

      setError(msg);
      setErrors(Array.isArray(apiErrors) ? apiErrors : []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#e6f4ec] flex items-center justify-center py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-4rem] top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl md:h-56 md:w-56"
        />
        <motion.div
          animate={{ x: [0, -18, 0], y: [0, 16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-[-4rem] h-44 w-44 rounded-full bg-cyan-200/20 blur-3xl md:h-60 md:w-60"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md mx-4"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8"
        >
          <motion.h1
            variants={itemVariants}
            className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-2"
          >
            Set a new password
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xs md:text-sm text-gray-500 text-center mb-4 md:mb-6"
          >
            Choose a strong new password for your account.
          </motion.p>

          {(error || errors.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 text-xs md:text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {error ? <div className="font-medium">{error}</div> : null}

              {errors.length > 0 && (
                <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[11px] md:text-xs">
                  {errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 text-xs md:text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2"
            >
              {message}
            </motion.div>
          )}

          <motion.form
            variants={containerVariants}
            onSubmit={handleSubmit}
            className="space-y-3 md:space-y-4"
          >
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                New password
              </label>

              <motion.div
                animate={{
                  y: passwordFocused ? -1 : 0,
                  scale: passwordFocused ? 1.01 : 1,
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative"
              >
                <motion.input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className={`${fieldClassName} pr-10`}
                  placeholder="Enter your new password"
                  animate={{
                    boxShadow: passwordFocused
                      ? "0px 0px 0px 4px rgba(16,185,129,0.12)"
                      : "0px 0px 0px 0px rgba(16,185,129,0)",
                  }}
                  transition={{ duration: 0.25 }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  whileTap={{ scale: 0.9 }}
                  animate={{ rotate: showPassword ? 180 : 0 }}
                  transition={{ duration: 0.28 }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </motion.button>
              </motion.div>

              <motion.div
                layout
                className="mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2"
              >
                <p className="text-[11px] text-gray-600 mb-1">
                  Use a strong password that includes:
                </p>
                <ul className="space-y-1">
                  {passwordChecks.map((rule, idx) => (
                    <motion.li
                      key={idx}
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-1 text-[11px] ${
                        rule.ok ? "text-emerald-700" : "text-gray-500"
                      }`}
                    >
                      <span>{rule.ok ? "✔" : "•"}</span>
                      <span>{rule.message}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Confirm new password
              </label>

              <motion.div
                animate={{
                  y: confirmPasswordFocused ? -1 : 0,
                  scale: confirmPasswordFocused ? 1.01 : 1,
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative"
              >
                <motion.input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className={`${fieldClassName} pr-10`}
                  placeholder="Re-enter new password"
                  animate={{
                    boxShadow: confirmPasswordFocused
                      ? "0px 0px 0px 4px rgba(16,185,129,0.12)"
                      : "0px 0px 0px 0px rgba(16,185,129,0)",
                  }}
                  transition={{ duration: 0.25 }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  whileTap={{ scale: 0.9 }}
                  animate={{ rotate: showConfirmPassword ? 180 : 0 }}
                  transition={{ duration: 0.28 }}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </motion.button>
              </motion.div>

              {confirmPassword.length > 0 && password !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-red-600"
                >
                  Passwords do not match.
                </motion.p>
              )}
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.995 }}
              type="submit"
              disabled={submitting}
              className="w-full h-10 md:h-11 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-semibold shadow-md transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating password..." : "Update password"}
            </motion.button>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="mt-4 text-[11px] md:text-xs text-gray-600 text-center"
          >
            Back to{" "}
            <Link to="/login" className="text-emerald-700 font-medium hover:underline">
              Login
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}