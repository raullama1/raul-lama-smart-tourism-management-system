// client/src/pages/public/SignupPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { requestSignupCode } from "../../api/authApi";
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

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);

  const fieldClassName = useMemo(
    () =>
      "w-full h-10 px-3 rounded-xl border border-gray-300 text-xs md:text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
    []
  );

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

  const missingPasswordRules = passwordChecks
    .filter((c) => !c.ok)
    .map((c) => c.message);

  const isPasswordStrong = missingPasswordRules.length === 0;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const clearAllErrors = () => {
    if (error) setError("");
    if (errors.length) setErrors([]);
  };

  const handleSendCode = async () => {
    if (!email) {
      setError("Please enter your email first.");
      setErrors([]);
      return;
    }

    try {
      setSendingCode(true);
      setError("");
      setErrors([]);

      await requestSignupCode(email);
      setCodeSent(true);
      setTimeLeft(60);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to send verification code. Try again.";
      setError(msg);
      setErrors(Array.isArray(err?.response?.data?.errors) ? err.response.data.errors : []);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !verificationCode) {
      setError("All fields are required.");
      setErrors([]);
      return;
    }

    if (!isPasswordStrong) {
      setError("Password is too weak. Please fix the following:");
      setErrors(missingPasswordRules);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setErrors([]);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setErrors([]);

      await signup(name, email, password, verificationCode);
      navigate("/");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Signup failed. Please try again.";
      const apiErrors = err?.response?.data?.errors;

      setError(msg);
      setErrors(Array.isArray(apiErrors) ? apiErrors : []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#e6f4ec] flex justify-center items-center py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-4rem] top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl md:h-56 md:w-56"
        />
        <motion.div
          animate={{ x: [0, -18, 0], y: [0, 16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 right-[-4rem] h-44 w-44 rounded-full bg-cyan-200/20 blur-3xl md:h-60 md:w-60"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md mx-auto px-4"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white rounded-3xl shadow-md border border-gray-100 p-4 md:p-5"
        >
          <motion.h1
            variants={itemVariants}
            className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-4"
          >
            Create Account
          </motion.h1>

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

          <motion.form
            variants={containerVariants}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearAllErrors();
                }}
                className={fieldClassName}
                placeholder="Enter your full name"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearAllErrors();
                  }}
                  className={`flex-1 ${fieldClassName}`}
                  placeholder="Enter your email"
                />

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || timeLeft > 0}
                  className="h-10 px-3 rounded-xl bg-emerald-600 text-white text-[11px] md:text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {sendingCode
                    ? "Sending..."
                    : timeLeft > 0
                    ? `Wait ${timeLeft}s`
                    : codeSent
                    ? "Resend"
                    : "Send Code"}
                </motion.button>
              </div>

              {codeSent && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-emerald-700"
                >
                  Code sent! Valid for 60 seconds.
                </motion.p>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  clearAllErrors();
                }}
                className={`${fieldClassName} tracking-[0.25em]`}
                placeholder="Enter code"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
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
                  autoComplete="new-password"
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className={`${fieldClassName} pr-10`}
                  placeholder="Create a strong password"
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
                <p className="text-[11px] text-gray-600 mb-1">Must include:</p>
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
                Confirm Password
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
                  value={confirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className={`${fieldClassName} pr-10`}
                  placeholder="Re-enter your password"
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
                  whileTap={{ scale: 0.9 }}
                  animate={{ rotate: showConfirmPassword ? 180 : 0 }}
                  transition={{ duration: 0.28 }}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
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
              className="w-full h-10 rounded-full bg-emerald-600 text-white text-sm md:text-base font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Sign Up"}
            </motion.button>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="mt-3 text-[11px] md:text-xs text-gray-600 text-center"
          >
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-700 font-medium hover:underline">
              Login
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}