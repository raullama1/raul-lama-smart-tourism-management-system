import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import AgencyAuthLayout from "../../components/agency/AgencyAuthLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";

export default function AgencyLoginPage() {
  const { login } = useAgencyAuth();
  const navigate = useNavigate();

  // removed default demo values
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

    try {
      setSubmitting(true);
      setError("");

      await login(trimmedEmail, trimmedPassword);

      // Later redirect to dashboard
      navigate("/agency/login");
    } catch (err) {
      console.error("Agency login failed", err);
      const msg =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthLayout>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 grid place-items-center">
            <span className="text-xl">✨</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Tourism Nepal
          </h1>
        </div>

        {error && (
          <div className="mt-4 text-xs md:text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your email"
            />
          </div>

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
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your password"
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
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="text-sm font-semibold text-gray-800 hover:underline"
              onClick={() => navigate("/agency/help")}
            >
              Forgot Password
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiLogIn size={18} />
              {submitting ? "Logging in..." : "Login"}
            </button>
          </div>

          <div className="pt-2 text-center text-sm text-gray-600">
            <span className="text-gray-500">New here?</span>{" "}
            <Link
              to="/agency/register"
              className="font-semibold text-gray-900 hover:underline"
            >
              Create Agency Account
            </Link>
          </div>
        </form>
      </div>
    </AgencyAuthLayout>
  );
}
