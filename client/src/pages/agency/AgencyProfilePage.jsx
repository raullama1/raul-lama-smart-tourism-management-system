// client/src/pages/agency/AgencyProfilePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { FiBell, FiKey, FiSave } from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import {
  buildAgencyAvatarUrl,
  changeAgencyPassword,
  fetchAgencyProfile,
  removeAgencyAvatar,
  updateAgencyProfile,
  uploadAgencyAvatar,
} from "../../api/agencyProfileApi";

function Toast({ open, type = "success", message, onClose }) {
  const boxClass =
    type === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-950"
      : "border-rose-400/30 bg-rose-500/10 text-rose-950";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[220] sm:right-6 sm:top-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={[
              "pointer-events-auto relative w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ring-1 ring-white/40 backdrop-blur-xl",
              boxClass,
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/25 to-white/5" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-700/80 transition hover:bg-black/5 hover:text-slate-950"
              aria-label="Close notification"
            >
              ✕
            </button>
            <div className="relative pr-8 text-sm font-semibold">{message}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-4 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/25 bg-white/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_38%)]" />
            <div className="relative">
              <div className="text-lg font-bold text-slate-900">{title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{message}</div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  className="rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:scale-[1.01] hover:shadow-red-500/30"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function ChangeAgencyPasswordModal({ open, onClose, token, onSuccess, onError }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaving(false);
    }
  }, [open]);

  const validate = () => {
    if (!currentPassword.trim()) return "Current password is required.";
    if (!newPassword.trim()) return "New password is required.";
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (!/[A-Z]/.test(newPassword)) return "New password must include an uppercase letter.";
    if (!/[a-z]/.test(newPassword)) return "New password must include a lowercase letter.";
    if (!/[0-9]/.test(newPassword)) return "New password must include a number.";
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return "New password must include a special character.";
    }
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    if (currentPassword === newPassword) {
      return "New password must be different from current password.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const message = validate();
    if (message) {
      onError(message);
      return;
    }

    try {
      setSaving(true);
      await changeAgencyPassword(token, {
        currentPassword,
        newPassword,
      });
      onSuccess("Password updated");
      onClose();
    } catch (err) {
      onError(err?.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[230] flex items-center justify-center px-4 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-white/25 bg-white/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-7"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_32%)]" />
            <div className="relative">
              <div className="text-xl font-bold tracking-tight text-slate-900">
                Change Password
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Update your agency account password securely.
              </div>

              <form onSubmit={handleSubmit} autoComplete="off" className="mt-6 space-y-4">
                <input
                  type="text"
                  name="fake_username"
                  autoComplete="username"
                  className="hidden"
                  tabIndex={-1}
                />
                <input
                  type="password"
                  name="fake_password"
                  autoComplete="new-password"
                  className="hidden"
                  tabIndex={-1}
                />

                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    Current Password
                  </div>
                  <input
                    type="password"
                    name="agency_current_password_secure"
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    New Password
                  </div>
                  <input
                    type="password"
                    name="agency_new_password_secure"
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </div>
                  <input
                    type="password"
                    name="agency_confirm_password_secure"
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function sanitizePhoneDigits(input) {
  return String(input || "").replace(/\D/g, "").slice(0, 10);
}

function validateAgencyName(raw) {
  const value = String(raw || "").trim();

  if (!value) return { ok: false, message: "Agency name is required." };
  if (value.length < 3) return { ok: false, message: "Agency name is too short." };
  if (value.length > 150) return { ok: false, message: "Agency name is too long." };

  return { ok: true, value };
}

function validatePhone(phoneDigits) {
  const value = sanitizePhoneDigits(phoneDigits);

  if (!value) return { ok: false, message: "Contact number is required." };
  if (value.length !== 10) return { ok: false, message: "Contact number must be 10 digits." };
  if (/^(\d)\1+$/.test(value)) return { ok: false, message: "Contact number looks invalid." };

  return { ok: true, value };
}

function validatePanVat(raw) {
  const value = String(raw || "").trim();

  if (!value) return { ok: false, message: "PAN/VAT number is required." };
  if (value.length < 5) return { ok: false, message: "PAN/VAT number is too short." };
  if (value.length > 50) return { ok: false, message: "PAN/VAT number is too long." };

  return { ok: true, value };
}

function validateAddress(raw) {
  const value = String(raw || "").trim();

  if (!value) return { ok: false, message: "Address is required." };
  if (value.length < 3) return { ok: false, message: "Address is too short." };
  if (value.length > 255) return { ok: false, message: "Address is too long." };

  return { ok: true, value };
}

function AgencyProfilePageContent({ openNotifications }) {
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [agency, setAgency] = useState(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [panVat, setPanVat] = useState("");

  const [initial, setInitial] = useState({
    name: "",
    phone: "",
    address: "",
    pan_vat: "",
  });

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2200);
  };

  const avatarUrl = useMemo(() => buildAgencyAvatarUrl(agency?.profile_image), [agency]);

  const load = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetchAgencyProfile(token);
      const nextAgency = res?.agency || null;

      setAgency(nextAgency);
      setName(String(nextAgency?.name || "").trim());
      setPhoneNumber(sanitizePhoneDigits(nextAgency?.phone || ""));
      setAddress(String(nextAgency?.address || "").trim());
      setPanVat(String(nextAgency?.pan_vat || "").trim());

      setInitial({
        name: String(nextAgency?.name || "").trim(),
        phone: sanitizePhoneDigits(nextAgency?.phone || ""),
        address: String(nextAgency?.address || "").trim(),
        pan_vat: String(nextAgency?.pan_vat || "").trim(),
      });
    } catch (err) {
      console.error("load agency profile", err);
      showToast("error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  const onPickFile = async (file) => {
    if (!file || !token) return;

    try {
      setImgLoading(true);
      const res = await uploadAgencyAvatar(token, file);
      const nextAgency = res?.agency || null;
      setAgency(nextAgency);
      showToast("success", "Profile photo updated");
    } catch (err) {
      console.error("upload agency avatar", err);
      showToast("error", "Image upload failed (PNG/JPG/WEBP, max 2MB).");
    } finally {
      setImgLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doRemoveAvatar = async () => {
    if (!token) return;

    try {
      setImgLoading(true);
      const res = await removeAgencyAvatar(token);
      const nextAgency = res?.agency || null;
      setAgency(nextAgency);
      showToast("success", "Profile photo removed");
    } catch (err) {
      console.error("remove agency avatar", err);
      showToast("error", "Failed to remove image.");
    } finally {
      setImgLoading(false);
    }
  };

  const isDirty = useMemo(() => {
    return (
      name.trim() !== initial.name ||
      sanitizePhoneDigits(phoneNumber) !== initial.phone ||
      address.trim() !== initial.address ||
      panVat.trim() !== initial.pan_vat
    );
  }, [name, phoneNumber, address, panVat, initial]);

  const onSave = async () => {
    if (!token) return;

    const nameCheck = validateAgencyName(name);
    if (!nameCheck.ok) return showToast("error", nameCheck.message);

    const phoneCheck = validatePhone(phoneNumber);
    if (!phoneCheck.ok) return showToast("error", phoneCheck.message);

    const addressCheck = validateAddress(address);
    if (!addressCheck.ok) return showToast("error", addressCheck.message);

    const panVatCheck = validatePanVat(panVat);
    if (!panVatCheck.ok) return showToast("error", panVatCheck.message);

    if (!isDirty) {
      showToast("error", "No changes to update.");
      return;
    }

    try {
      setSaving(true);

      const res = await updateAgencyProfile(token, {
        name: nameCheck.value,
        phone: phoneCheck.value,
        address: addressCheck.value,
        pan_vat: panVatCheck.value,
      });

      const nextAgency = res?.agency || null;

      setAgency(nextAgency);
      setName(String(nextAgency?.name || "").trim());
      setPhoneNumber(sanitizePhoneDigits(nextAgency?.phone || ""));
      setAddress(String(nextAgency?.address || "").trim());
      setPanVat(String(nextAgency?.pan_vat || "").trim());

      setInitial({
        name: String(nextAgency?.name || "").trim(),
        phone: sanitizePhoneDigits(nextAgency?.phone || ""),
        address: String(nextAgency?.address || "").trim(),
        pan_vat: String(nextAgency?.pan_vat || "").trim(),
      });

      showToast("success", "Profile updated");
    } catch (err) {
      console.error("update agency profile", err);
      showToast("error", err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (agency?.name || "A").trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(135deg,#e8f6ee_0%,#edf5ff_42%,#f5f8fb_100%)] text-slate-900 shadow-[0_20px_70px_rgba(16,24,40,0.08)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, 24, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[-6rem] top-[-6rem] h-60 w-60 rounded-full bg-emerald-300/25 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -18, 0], y: [0, 18, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[-7rem] top-20 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 16, 0], y: [0, -18, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-teal-200/25 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative flex min-h-0 flex-1 flex-col"
        >
          <div className="overflow-hidden rounded-[30px] border border-white/40 bg-white/65 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className="relative border-b border-white/60 px-5 py-5 sm:px-7 sm:py-6 lg:px-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_35%)]" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="inline-flex w-fit items-center rounded-full border border-emerald-200/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
                  >
                    Tourism Nepal
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl xl:text-4xl">
                      Agency Profile
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start lg:self-center">
                  <motion.button
                    whileHover={{ y: -3, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={handleOpenNotifications}
                    className="group relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/85 text-slate-700 shadow-sm transition duration-200 hover:bg-white hover:shadow-lg"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <FiBell size={18} className="transition group-hover:scale-110" />
                    {Number(unreadCount || 0) > 0 && (
                      <motion.span
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -right-1 -top-1 grid h-6 min-w-[24px] place-items-center rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-red-500/25"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </motion.span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="relative px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                <motion.section
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                  className="relative overflow-hidden rounded-[30px] border border-white/60 bg-white/75 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.09),transparent_30%)]" />
                  <div className="relative">
                    <div className="flex flex-col items-center text-center">
                      <Tilt
                        tiltEnable
                        tiltMaxAngleX={10}
                        tiltMaxAngleY={10}
                        perspective={1800}
                        transitionSpeed={1500}
                        scale={1.02}
                        glareEnable
                        glareMaxOpacity={0.08}
                        glareColor="#ffffff"
                        glarePosition="all"
                        className="rounded-[34px]"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.18, duration: 0.3 }}
                          className="relative"
                        >
                          <div className="absolute inset-[-10px] rounded-[34px] bg-gradient-to-br from-emerald-400/30 via-teal-300/20 to-sky-300/20 blur-xl" />
                          <div className="relative h-28 w-28 overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-emerald-100 to-teal-50 shadow-[0_15px_40px_rgba(16,185,129,0.18)] sm:h-32 sm:w-32">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="Agency profile"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-emerald-900 sm:text-4xl">
                                {initials}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </Tilt>

                      <div className="mt-5">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                          {agency?.name || "Agency"}
                        </h2>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {agency?.email || "agency@email.com"}
                        </p>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22, duration: 0.25 }}
                        className="mt-4 inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        Keep your profile polished and trusted
                      </motion.div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => onPickFile(e.target.files?.[0])}
                      />

                      <motion.button
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="button"
                        disabled={imgLoading}
                        onClick={() => fileRef.current?.click()}
                        className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {imgLoading ? "Processing..." : avatarUrl ? "Change Photo" : "Upload Photo"}
                      </motion.button>

                      {avatarUrl ? (
                        <motion.button
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                          type="button"
                          disabled={imgLoading}
                          onClick={() => setConfirmRemove(true)}
                          className="w-full rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove Photo
                        </motion.button>
                      ) : null}

                      <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-center text-xs font-medium text-slate-500">
                        PNG / JPG / WEBP • max 2MB
                      </div>
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.16, duration: 0.35 }}
                  className="relative overflow-hidden rounded-[30px] border border-white/60 bg-white/75 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6 lg:p-7"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_28%)]" />
                  <div className="relative">
                    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900">
                          Profile Information
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Update your business details and keep everything accurate.
                        </p>
                      </div>

                      <AnimatePresence mode="wait">
                        {isDirty ? (
                          <motion.div
                            key="dirty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                          >
                            Unsaved changes
                          </motion.div>
                        ) : (
                          <motion.div
                            key="saved"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Everything saved
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.22 }}
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          Agency Name
                        </div>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={loading}
                          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                          placeholder="Agency name"
                          maxLength={150}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24 }}
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          Email
                        </div>
                        <input
                          value={agency?.email || ""}
                          readOnly
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm text-slate-600 shadow-sm"
                          placeholder="Email"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.26 }}
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          Contact Number
                        </div>
                        <input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(sanitizePhoneDigits(e.target.value))}
                          disabled={loading}
                          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                          placeholder="10 digit contact number"
                          maxLength={10}
                          inputMode="numeric"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 }}
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          Address
                        </div>
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={loading}
                          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                          placeholder="Agency address"
                          maxLength={255}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          PAN / VAT Number
                        </div>
                        <input
                          value={panVat}
                          onChange={(e) => setPanVat(e.target.value)}
                          disabled={loading}
                          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                          placeholder="PAN/VAT number"
                          maxLength={50}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          Password
                        </div>
                        <input
                          value="••••••••"
                          readOnly
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm text-slate-600 shadow-sm"
                          placeholder="Password"
                        />
                      </motion.div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <motion.button
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="button"
                        onClick={() => setChangePwdOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white hover:shadow-md"
                      >
                        <FiKey size={16} />
                        Change Password
                      </motion.button>

                      <motion.button
                        whileHover={saving || loading || !isDirty ? {} : { y: -2, scale: 1.01 }}
                        whileTap={saving || loading || !isDirty ? {} : { scale: 0.985 }}
                        type="button"
                        onClick={onSave}
                        disabled={saving || loading || !isDirty}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiSave size={16} />
                        {saving ? "Updating..." : "Update Profile"}
                      </motion.button>
                    </div>
                  </div>
                </motion.section>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />

      <ConfirmModal
        open={confirmRemove}
        title="Remove profile picture?"
        message="This will remove your current profile photo."
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          doRemoveAvatar();
        }}
      />

      <ChangeAgencyPasswordModal
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
        token={token}
        onSuccess={(message) => showToast("success", message)}
        onError={(message) => showToast("error", message)}
      />
    </>
  );
}

export default function AgencyProfilePage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyProfilePageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}