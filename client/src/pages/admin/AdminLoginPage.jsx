// client/src/pages/admin/AdminLoginPage.jsx
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiLogIn, FiShield, FiMail, FiLock } from "react-icons/fi";
import { motion } from "framer-motion";
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
        <div className="flex min-h-[420px] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/70 px-10 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="text-sm font-semibold text-slate-500">Loading...</p>
          </div>
        </div>
      </AdminAuthLayout>
    );
  }

  return (
    <AdminAuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-[560px] overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
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
                Secure Access
              </div>
              <h1 className="mt-4 text-[28px] font-black tracking-tight text-slate-900 md:text-[32px]">
                Tourism Nepal Admin
              </h1>
            </div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/70 bg-white/70 text-emerald-700 shadow-lg backdrop-blur md:flex"
            >
              <FiShield size={28} />
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </motion.div>
            ) : null}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-600 md:text-[15px]">
                Email
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-600">
                  <FiMail size={18} />
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your email"
                  className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-600 md:text-[15px]">
                Password
              </label>

              <div className="group relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-600">
                  <FiLock size={18} />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-12 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={submitting}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-500 text-[15px] font-semibold text-white shadow-[0_16px_40px_rgba(5,150,105,0.28)] transition hover:from-emerald-700 hover:via-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiLogIn size={18} />
              {submitting ? "Logging in..." : "Login to Admin Panel"}
            </motion.button>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => navigate("/admin/forgot-password")}
                className="text-sm font-semibold text-slate-500 transition hover:text-emerald-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AdminAuthLayout>
  );
}