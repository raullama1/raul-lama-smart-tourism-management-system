// client/src/pages/public/SignupPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { requestSignupCode } from "../../api/authApi";
import { FiEye, FiEyeOff } from "react-icons/fi";

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

  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]); // ✅ multiple errors

  // Password rules (same wording as backend)
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

  // Timer for resend code
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

    // ✅ show exactly which rules are missing (client-side)
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
    <main className="h-screen bg-[#e6f4ec] flex justify-center items-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-4 md:p-5">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-4">
            Create Account
          </h1>

          {(error || errors.length > 0) && (
            <div className="mb-3 text-xs md:text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error ? <div className="font-medium">{error}</div> : null}

              {errors.length > 0 && (
                <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[11px] md:text-xs">
                  {errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
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
                className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email + Code */}
            <div className="space-y-1">
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
                  className="flex-1 h-10 px-3 rounded-xl border border-gray-300 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your email"
                />

                <button
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
                </button>
              </div>

              {codeSent && (
                <p className="text-[11px] text-emerald-700">
                  Code sent! Valid for 60 seconds.
                </p>
              )}
            </div>

            {/* Verification Code */}
            <div className="space-y-1">
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
                className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 tracking-[0.25em]"
                placeholder="Enter code"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-300 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Create a strong password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {/* Strength Rules */}
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearAllErrors();
                  }}
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-300 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Re-enter your password"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-full bg-emerald-600 text-white text-sm md:text-base font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-3 text-[11px] md:text-xs text-gray-600 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-700 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
