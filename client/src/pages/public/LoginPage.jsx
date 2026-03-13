// client/src/pages/public/LoginPage.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fieldClassName = useMemo(
    () =>
      "w-full h-10 md:h-11 px-3 rounded-xl border border-gray-300 text-xs md:text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required.");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await login(trimmedEmail, trimmedPassword);
      navigate("/home");
    } catch (err) {
      console.error("Login failed", err);
      const msg =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#e6f4ec] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, -16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-4rem] top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl md:h-56 md:w-56"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-[-4rem] h-44 w-44 rounded-full bg-cyan-200/20 blur-3xl md:h-60 md:w-60"
        />
      </div>

      <motion.button
        type="button"
        onClick={() => navigate("/")}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.16)] backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-[0_16px_40px_rgba(16,185,129,0.22)] md:left-7 md:top-7"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <FiArrowLeft size={16} />
        </span>
        <span>Back to Home</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-gray-100 bg-white p-6 shadow-md md:p-8"
        >
          <motion.h1
            variants={itemVariants}
            className="mb-1 text-center text-xl font-semibold text-gray-900 md:text-2xl"
          >
            Tourism Nepal
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mb-6 text-center text-xs text-gray-500 md:text-sm"
          >
            Log in to unlock all features and manage your trips.
          </motion.p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600 md:text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            variants={containerVariants}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-medium text-gray-700 md:text-sm">
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

            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs font-medium text-gray-700 md:text-sm">
                Password
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
                  autoComplete="current-password"
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className={`${fieldClassName} pr-10`}
                  placeholder="Enter your password"
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
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 transition-colors hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  whileTap={{ scale: 0.9 }}
                  animate={{ rotate: showPassword ? 180 : 0 }}
                  transition={{ duration: 0.28 }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end">
              <button
                type="button"
                className="text-[11px] text-emerald-700 transition-colors hover:text-emerald-800 hover:underline md:text-xs"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.995 }}
                type="submit"
                disabled={submitting}
                className="h-10 w-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm font-semibold text-white shadow-md transition-transform md:h-11 md:text-base disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Logging in..." : "Login"}
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="mt-4 text-center text-[11px] text-gray-600 md:text-xs"
          >
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-emerald-700 hover:underline"
            >
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}