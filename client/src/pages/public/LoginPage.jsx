// client/src/pages/public/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required.");
      return;
    }

    // error if password is shorter than 8 characters
    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login(trimmedEmail, trimmedPassword);

      // later redirect by role; for now go to public home
      navigate("/");
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
    <main className="min-h-screen bg-[#e6f4ec] flex items-center justify-center py-10">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-8">
          {/* Title */}
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 text-center mb-1">
            Tourism Nepal
          </h1>
          <p className="text-xs md:text-sm text-gray-500 text-center mb-6">
            Log in to unlock all features and manage your trips.
          </p>

          {error && (
            <div className="mb-4 text-xs md:text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
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
                className="w-full h-10 md:h-11 px-3 rounded-xl border border-gray-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Password + show/hide */}
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full h-10 md:h-11 px-3 pr-10 rounded-xl border border-gray-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[11px] md:text-xs text-emerald-700 hover:underline"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 md:h-11 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-semibold shadow-md hover:scale-[1.02] active:scale-100 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-4 text-[11px] md:text-xs text-gray-600 text-center">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-emerald-700 font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
