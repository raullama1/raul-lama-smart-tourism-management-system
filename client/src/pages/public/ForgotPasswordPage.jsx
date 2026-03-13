// client/src/pages/public/ForgotPasswordPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { requestPasswordReset } from "../../api/authApi";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fieldClassName = useMemo(
    () =>
      "w-full h-10 md:h-11 px-3 rounded-xl border border-gray-300 text-xs md:text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
    []
  );

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
    <main className="relative min-h-screen bg-[#e6f4ec] flex items-center justify-center py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 16, 0], y: [0, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-4rem] top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl md:h-56 md:w-56"
        />
        <motion.div
          animate={{ x: [0, -16, 0], y: [0, 14, 0] }}
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
            Forgot password?
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xs md:text-sm text-gray-500 text-center mb-4 md:mb-6"
          >
            Enter your email address and we&apos;ll send you a reset link.
          </motion.p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {error}
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
                className={fieldClassName}
                placeholder="Enter your email"
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.995 }}
              type="submit"
              disabled={submitting}
              className="w-full h-10 md:h-11 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-semibold shadow-md transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending link..." : "Send reset link"}
            </motion.button>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="mt-4 text-[11px] md:text-xs text-gray-600 text-center"
          >
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-emerald-700 font-medium hover:underline"
            >
              Back to login
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}