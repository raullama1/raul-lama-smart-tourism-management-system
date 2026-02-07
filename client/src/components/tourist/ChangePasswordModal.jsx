// client/src/components/tourist/ChangePasswordModal.jsx
import { useMemo, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { changePassword } from "../../api/authApi";

/*
  ChangePasswordModal
  - UI only (modal)
  - Calls API to change password for logged-in user
  - Uses same password rules and wording as SignupPage + backend
*/
export default function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);

  // Password rules (same wording as backend validation)
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
    ok: rule.test.test(newPassword),
  }));

  const missingPasswordRules = passwordChecks.filter((c) => !c.ok).map((c) => c.message);
  const isPasswordStrong = missingPasswordRules.length === 0;

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirmNew(false);
    setError("");
    setErrors([]);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose?.();
  };

  const clearErrors = () => {
    if (error) setError("");
    if (errors.length) setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cur = currentPassword;
    const next = newPassword;

    if (!cur || !next || !confirmNewPassword) {
      setError("All fields are required.");
      setErrors([]);
      return;
    }

    if (cur === next) {
      setError("New password must be different from current password.");
      setErrors([]);
      return;
    }

    if (!isPasswordStrong) {
      setError("Password is too weak. Please fix the following:");
      setErrors(missingPasswordRules);
      return;
    }

    if (next !== confirmNewPassword) {
      setError("New passwords do not match.");
      setErrors([]);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setErrors([]);

      await changePassword(cur, next);

      onSuccess?.();
      resetForm();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to change password. Please try again.";
      const apiErrors = err?.response?.data?.errors;

      setError(msg);
      setErrors(Array.isArray(apiErrors) ? apiErrors : []);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-5">
        <div className="text-base font-semibold text-gray-900">Change Password</div>
        <div className="mt-1 text-sm text-gray-600">
          Enter your current password and set a new one.
        </div>

        {(error || errors.length > 0) && (
          <div className="mt-3 text-xs md:text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Current password */}
          <div className="space-y-1">
            <label className="text-xs md:text-sm font-semibold text-emerald-900/70">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearErrors();
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                {showCurrent ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1">
            <label className="text-xs md:text-sm font-semibold text-emerald-900/70">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearErrors();
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Create a new password"
                autoComplete="new-password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* Password strength rules */}
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

            {currentPassword.length > 0 && newPassword.length > 0 && currentPassword === newPassword && (
              <div className="text-[11px] text-red-600">
                New password must not be the same as current password.
              </div>
            )}
          </div>

          {/* Confirm new password */}
          <div className="space-y-1">
            <label className="text-xs md:text-sm font-semibold text-emerald-900/70">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmNew ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  clearErrors();
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Re-enter new password"
                autoComplete="new-password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowConfirmNew((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                {showConfirmNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
              <p className="text-[11px] text-red-600">New passwords do not match.</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
