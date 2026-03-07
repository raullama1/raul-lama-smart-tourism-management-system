// client/src/pages/agency/AgencyProfilePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FiBell, FiKey, FiSave } from "react-icons/fi";
import AgencySidebar from "../../components/agency/AgencySidebar";
import AgencyNotificationsDrawer from "../../components/agency/AgencyNotificationsDrawer";
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[220] pointer-events-none">
      <div
        className={[
          "pointer-events-auto relative w-[320px] rounded-2xl border px-4 py-3 shadow-lg",
          "transition-all duration-300 ease-out",
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          boxClass,
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-700/70 hover:bg-black/5 hover:text-gray-900"
          aria-label="Close notification"
        >
          ✕
        </button>

        <div className="pr-8 text-sm font-semibold">{message}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
        <div className="text-base font-semibold text-gray-900">{title}</div>
        <div className="mt-1 text-sm text-gray-600">{message}</div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
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

  if (!open) return null;

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

  const handleSubmit = async () => {
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
    <div className="fixed inset-0 z-[230] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
        <div className="text-lg font-semibold text-gray-900">Change Password</div>
        <div className="mt-1 text-sm text-gray-500">
          Update your agency account password.
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Current Password
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              New Password
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-emerald-900/70">
              Confirm New Password
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
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
  if (value.length !== 10) {
    return { ok: false, message: "Contact number must be 10 digits." };
  }
  if (/^(\d)\1+$/.test(value)) {
    return { ok: false, message: "Contact number looks invalid." };
  }

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

export default function AgencyProfilePage() {
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();
  const fileRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const avatarUrl = useMemo(
    () => buildAgencyAvatarUrl(agency?.profile_image),
    [agency]
  );

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
    setDrawerOpen(true);

    try {
      await refresh?.();
    } catch {
      // ignore
    }
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

  return (
    <>
      <div className="h-screen overflow-hidden bg-[#dfe9e2]">
        <div className="flex h-full">
          <div className="h-full shrink-0">
            <AgencySidebar />
          </div>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-7xl rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-emerald-100 px-6 py-5">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-800">
                    Agency Profile
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={handleOpenNotifications}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-700 transition hover:bg-emerald-50"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <FiBell size={18} />
                  {Number(unreadCount || 0) > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-6 min-w-[24px] place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-100 bg-emerald-100">
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
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-900">
                          {(agency?.name || "A")[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Profile photo
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          onChange={(e) => onPickFile(e.target.files?.[0])}
                        />

                        <button
                          type="button"
                          disabled={imgLoading}
                          onClick={() => fileRef.current?.click()}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {avatarUrl ? "Change photo" : "Upload photo"}
                        </button>

                        {avatarUrl ? (
                          <button
                            type="button"
                            disabled={imgLoading}
                            onClick={() => setConfirmRemove(true)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        PNG/JPG/WEBP • max 2MB
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold text-emerald-900/70">
                        Agency Name
                      </div>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Agency name"
                        maxLength={150}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-emerald-900/70">
                        Email
                      </div>
                      <input
                        value={agency?.email || ""}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                        placeholder="Email"
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-emerald-900/70">
                        Contact Number
                      </div>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(sanitizePhoneDigits(e.target.value))}
                        disabled={loading}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="10 digit contact number"
                        maxLength={10}
                        inputMode="numeric"
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-emerald-900/70">
                        Address
                      </div>
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={loading}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Agency address"
                        maxLength={255}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-emerald-900/70">
                        PAN/VAT Number (Nepal)
                      </div>
                      <input
                        value={panVat}
                        onChange={(e) => setPanVat(e.target.value)}
                        disabled={loading}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="PAN/VAT number"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-emerald-900/70">
                        Password
                      </div>
                      <input
                        value="••••••••"
                        readOnly
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                        placeholder="Password"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setChangePwdOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <FiKey size={16} />
                      Change Password
                    </button>

                    <button
                      type="button"
                      onClick={onSave}
                      disabled={saving || loading || !isDirty}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiSave size={16} />
                      {saving ? "Updating..." : "Update Profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <AgencyNotificationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

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