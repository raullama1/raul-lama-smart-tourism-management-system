// client/src/pages/admin/AdminLoginPage.jsx
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AdminAuthLayout from "../../components/admin/AdminAuthLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLoginPage() {
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError("Email/username and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login(trimmedIdentifier, trimmedPassword);

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminAuthLayout>
        <div className="text-gray-600">Loading...</div>
      </AdminAuthLayout>
    );
  }

  return (
    <AdminAuthLayout>
      <div className="w-full max-w-[510px] rounded-2xl bg-white/80 border border-[#d9e6dd] shadow-sm px-6 py-7 md:px-8 md:py-8">
        <h1 className="text-[24px] md:text-[26px] font-semibold text-[#1a2f28]">
          Tourism Nepal – Admin Panel
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[16px] font-semibold text-[#6d8e7b] mb-2">
              Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter your email"
              className="w-full h-[48px] rounded-xl border border-[#d7e3da] bg-white px-4 text-[16px] font-medium text-[#1d3028] placeholder:text-[#1d3028] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[16px] font-semibold text-[#6d8e7b] mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your password"
                className="w-full h-[48px] rounded-xl border border-[#d7e3da] bg-white px-4 pr-11 text-[16px] font-medium text-[#1d3028] placeholder:text-[#1d3028] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[50px] rounded-xl bg-[#04753d] text-white text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-[#046736] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FiLogIn size={18} />
            {submitting ? "Logging in..." : "Login"}
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/forgot-password")}
              className="text-[14px] font-semibold text-[#6d8e7b] hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </AdminAuthLayout>
  );
}