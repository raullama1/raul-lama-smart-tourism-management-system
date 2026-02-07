// client/src/pages/tourist/TouristProfilePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import ChangePasswordModal from "../../components/tourist/ChangePasswordModal";
import { useAuth } from "../../context/AuthContext";
import {
  fetchMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  removeMyAvatar,
  buildAvatarUrl,
} from "../../api/profileApi";

/* Simple toast (no library) */
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

/* Confirm modal */
function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100 p-5">
        <div className="text-base font-semibold text-gray-900">{title}</div>
        <div className="mt-1 text-sm text-gray-600">{message}</div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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

export default function TouristProfilePage() {
  const { token } = useAuth();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  const [user, setUser] = useState(null);

  const [name, setName] = useState("");

  // phone split into country code + number (but saved as one string)
  const [countryCode, setCountryCode] = useState("+977");
  const [phoneNumber, setPhoneNumber] = useState("");

  // toast state
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  // confirm remove avatar modal
  const [confirmRemove, setConfirmRemove] = useState(false);

  // ✅ change password modal
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  };

  const createdLabel = useMemo(() => {
    if (!user?.created_at) return "";
    const d = new Date(user.created_at);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [user]);

  const avatarUrl = useMemo(() => buildAvatarUrl(user?.profile_image), [user]);

  const splitPhone = (full) => {
    const s = String(full || "").trim();
    if (!s) return { code: "+977", num: "" };

    // supports formats like "+9779812345678" or "+977 9812345678"
    const cleaned = s.replace(/\s+/g, "");
    const m = cleaned.match(/^(\+\d{1,4})(\d+)$/);
    if (m) return { code: m[1], num: m[2] };

    // if user saved only digits, keep default code
    if (/^\d+$/.test(cleaned)) return { code: "+977", num: cleaned };

    // fallback
    return { code: "+977", num: cleaned.replace(/\D/g, "") };
  };

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetchMyProfile(token);
      const u = res?.data?.user;
      setUser(u || null);
      setName(u?.name || "");

      const { code, num } = splitPhone(u?.phone || "");
      setCountryCode(code);
      setPhoneNumber(num);
    } catch (e) {
      console.error("load profile", e);
      showToast("error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onPickFile = async (file) => {
    if (!file || !token) return;

    try {
      setImgLoading(true);
      const res = await uploadMyAvatar(token, file);

      const u = res?.data?.user;
      setUser(u || null);

      showToast("success", "Profile photo updated");
    } catch (e) {
      console.error("upload avatar", e);
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
      const res = await removeMyAvatar(token);

      const u = res?.data?.user;
      setUser(u || null);

      showToast("success", "Profile photo removed");
    } catch (e) {
      console.error("remove avatar", e);
      showToast("error", "Failed to remove image.");
    } finally {
      setImgLoading(false);
    }
  };

  const onSave = async () => {
    if (!token) return;
    const n = name.trim();
    if (!n) {
      showToast("error", "Name is required.");
      return;
    }

    // save as one string: +CODE + NUMBER (or empty string if user cleared)
    const fullPhone = phoneNumber.trim()
      ? `${countryCode}${phoneNumber.trim()}`
      : "";

    try {
      setSaving(true);
      const res = await updateMyProfile(token, { name: n, phone: fullPhone });

      const u = res?.data?.user;
      setUser(u || null);

      // keep UI synced if backend returns updated phone
      const { code, num } = splitPhone(u?.phone || fullPhone);
      setCountryCode(code);
      setPhoneNumber(num);

      showToast("success", "Profile updated");
    } catch (e) {
      console.error("update profile", e);
      showToast("error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <NavbarTourist />

      <main className="bg-[#f3faf6] pt-6 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">Profile</div>
                <div className="text-sm text-emerald-700/80 font-semibold">
                  {user?.created_at ? `Account created on ${createdLabel}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  {user?.role
                    ? user.role[0].toUpperCase() + user.role.slice(1)
                    : "Tourist"}
                </span>
              </div>
            </div>

            {/* avatar */}
            <div className="mt-6 flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border border-gray-100 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-emerald-900">
                    {(user?.name || "T")[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  Profile photo
                </div>

                <div className="flex flex-wrap gap-2">
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

                  {avatarUrl && (
                    <button
                      type="button"
                      disabled={imgLoading}
                      onClick={() => setConfirmRemove(true)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  )}

                  {imgLoading && (
                    <div className="text-sm text-gray-500 flex items-center">
                      Uploading...
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">PNG/JPG/WEBP • max 2MB</div>
              </div>
            </div>

            {/* form */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-sm font-semibold text-emerald-900/70">
                  Name
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-emerald-900/70">
                    Email
                  </div>
                  <input
                    value={user?.email || ""}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-700"
                    placeholder="Email"
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold text-emerald-900/70">
                    Phone
                  </div>

                  {/* same design area, just split into dropdown + input */}
                  <div className="mt-2 flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border border-gray-200 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="+977">+977 (Nepal)</option>
                      <option value="+91">+91 (India)</option>
                      <option value="+1">+1 (USA/Canada)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (Australia)</option>
                      <option value="+81">+81 (Japan)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+49">+49 (Germany)</option>
                      <option value="+33">+33 (France)</option>
                    </select>

                    <input
                      value={phoneNumber}
                      onChange={(e) => {
                        // numbers only
                        const onlyDigits = e.target.value.replace(/\D/g, "");
                        setPhoneNumber(onlyDigits);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Phone number"
                      disabled={loading}
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || loading}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Update Profile"}
                </button>

                <button
                  type="button"
                  onClick={() => setChangePwdOpen(true)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Change Password
                </button>
              </div>

              <div className="text-xs text-gray-500">
                By updating, you agree to our latest terms.
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterTourist />

      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
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

      <ChangePasswordModal
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
        onSuccess={() => showToast("success", "Password updated")}
      />
    </>
  );
}
