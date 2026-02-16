import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import AgencyAuthLayout from "../../components/agency/AgencyAuthLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";

function Toast({ open, type = "success", message, onClose }) {
  if (!open) return null;

  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[200]">
      <div className={`rounded-2xl border px-4 py-3 shadow-lg ${boxClass}`}>
        <div className="text-sm font-semibold">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs font-semibold opacity-80 hover:opacity-100"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function AgencyLoginPage() {
  const { login } = useAgencyAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    const t = location.state?.toast;
    if (!t?.message) return;

    setToast({ open: true, type: t.type || "success", message: t.message });

    window.clearTimeout(AgencyLoginPage._t);
    AgencyLoginPage._t = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

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

      navigate("/agency/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AgencyAuthLayout>
        <div className="w-full flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  className="text-[11px] md:text-xs text-emerald-700 hover:underline"
                  onClick={() => navigate("/agency/forgot-password")}
                >
                  Forgot password?
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:scale-[1.02] active:scale-100 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiLogIn size={18} />
                  {submitting ? "Logging in..." : "Login"}
                </button>
              </div>

              <p className="pt-2 text-center text-[11px] md:text-xs text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  to="/agency/register"
                  className="text-emerald-700 font-medium hover:underline"
                >
                  Create Agency Account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </AgencyAuthLayout>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />
    </>
  );
}
