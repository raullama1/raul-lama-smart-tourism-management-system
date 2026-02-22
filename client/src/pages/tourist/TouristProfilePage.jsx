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
  const boxClass =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className="fixed top-5 right-5 z-[200] pointer-events-none">
      <div
        className={[
          "pointer-events-auto w-[320px] rounded-2xl border px-4 py-3 shadow-lg",
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
          className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-700/70 hover:text-gray-900 hover:bg-black/5"
          aria-label="Close notification"
        >
          ✕
        </button>

        <div className="pr-8 text-sm font-semibold">{message}</div>
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

  const [countryCode, setCountryCode] = useState("+977");
  const [phoneNumber, setPhoneNumber] = useState("");

  // baseline values to detect changes
  const [initial, setInitial] = useState({
    name: "",
    phone: "",
  });

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  /* ---- Validation helpers ---- */

  const PHONE_MAX_DIGITS = 10;

  // Keep only digits and cap to max length
  const sanitizePhoneDigits = (input) => {
    const digits = String(input || "").replace(/\D/g, "");
    return digits.slice(0, PHONE_MAX_DIGITS);
  };

  // Soft "realistic name" validation (can't prove real, but avoids junk)
  const validateName = (raw) => {
    const v = String(raw || "").trim();

    if (!v) return { ok: false, message: "Name is required." };

    if (v.length < 4) return { ok: false, message: "Name is too short." };
    if (v.length > 40) return { ok: false, message: "Name is too long." };

    // Allow letters + spaces + . ' -
    const allowed = /^[A-Za-z\s.'-]+$/;
    if (!allowed.test(v)) {
      return {
        ok: false,
        message: "Name can contain only letters, spaces, . ' and -",
      };
    }

    // Must have at least 2 letters total
    const lettersCount = (v.match(/[A-Za-z]/g) || []).length;
    if (lettersCount < 2) {
      return { ok: false, message: "Please enter a valid full name." };
    }

    // Avoid junk like "aaaaaa" or "xxxxx"
    if (/(.)\1\1/.test(v.replace(/\s+/g, ""))) {
      return { ok: false, message: "Name looks invalid (too repetitive)." };
    }

    // Avoid single-letter spaced patterns like "x x x"
    if (/^([A-Za-z]\s){2,}[A-Za-z]$/.test(v)) {
      return { ok: false, message: "Please enter your full name." };
    }

    return { ok: true, value: v };
  };

  // Phone rule: if provided, must be exactly 10 digits
  const validatePhone = (digits) => {
    const d = sanitizePhoneDigits(digits);

    if (!d) return { ok: true, value: "" }; // optional
    if (d.length !== PHONE_MAX_DIGITS) {
      return {
        ok: false,
        message: `Phone number must be ${PHONE_MAX_DIGITS} digits.`,
      };
    }

    // basic sanity: disallow all same digits like 0000000000
    if (/^(\d)\1+$/.test(d)) {
      return { ok: false, message: "Phone number looks invalid." };
    }

    return { ok: true, value: d };
  };

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

    const cleaned = s.replace(/\s+/g, "");
    const m = cleaned.match(/^(\+\d{1,4})(\d+)$/);
    if (m) return { code: m[1], num: sanitizePhoneDigits(m[2]) };

    if (/^\d+$/.test(cleaned))
      return { code: "+977", num: sanitizePhoneDigits(cleaned) };

    return { code: "+977", num: sanitizePhoneDigits(cleaned) };
  };

  const normalizePhone = (code, num) => {
    const n = sanitizePhoneDigits(num);
    const c = String(code || "").trim();
    return n ? `${c}${n}` : "";
  };

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetchMyProfile(token);
      const u = res?.data?.user;

      setUser(u || null);

      const nextName = String(u?.name || "").trim();
      setName(nextName);

      const { code, num } = splitPhone(u?.phone || "");
      setCountryCode(code);
      setPhoneNumber(num);

      const nextPhone = normalizePhone(code, num);

      // set baseline (so button is disabled until changes)
      setInitial({
        name: nextName,
        phone: nextPhone,
      });
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

  // detect changes
  const currentPhone = useMemo(
    () => normalizePhone(countryCode, phoneNumber),
    [countryCode, phoneNumber]
  );

  const isDirty = useMemo(() => {
    const currentName = name.trim();
    return currentName !== initial.name || currentPhone !== initial.phone;
  }, [name, currentPhone, initial]);

  const onSave = async () => {
    if (!token) return;

    const nameCheck = validateName(name);
    if (!nameCheck.ok) {
      showToast("error", nameCheck.message);
      return;
    }

    if (!isDirty) {
      showToast("error", "No changes to update.");
      return;
    }

    const phoneCheck = validatePhone(phoneNumber);
    if (!phoneCheck.ok) {
      showToast("error", phoneCheck.message);
      return;
    }

    const fullPhone = phoneCheck.value
      ? normalizePhone(countryCode, phoneCheck.value)
      : "";

    try {
      setSaving(true);
      const res = await updateMyProfile(token, {
        name: nameCheck.value,
        phone: fullPhone,
      });

      const u = res?.data?.user;
      setUser(u || null);

      const { code, num } = splitPhone(u?.phone || fullPhone);
      setCountryCode(code);
      setPhoneNumber(num);

      const syncedName = String(u?.name || nameCheck.value).trim();
      const syncedPhone = normalizePhone(code, num);

      // update baseline after successful save
      setInitial({
        name: syncedName,
        phone: syncedPhone,
      });

      showToast("success", "Profile updated");
    } catch (e) {
      console.error("update profile", e);
      showToast("error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const nameHint = useMemo(() => {
    if (!name.trim()) return "";
    const r = validateName(name);
    return r.ok ? "" : r.message;
  }, [name]);

  const phoneHint = useMemo(() => {
    if (!phoneNumber) return "";
    const r = validatePhone(phoneNumber);
    return r.ok ? "" : r.message;
  }, [phoneNumber]);

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

                <div className="text-xs text-gray-500">
                  PNG/JPG/WEBP • max 2MB
                </div>
              </div>
            </div>

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
                  maxLength={40}
                  autoComplete="name"
                />
                {nameHint && (
                  <div className="mt-1 text-xs font-semibold text-red-600">
                    {nameHint}
                  </div>
                )}
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
                      onChange={(e) =>
                        setPhoneNumber(sanitizePhoneDigits(e.target.value))
                      }
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text");
                        setPhoneNumber(sanitizePhoneDigits(text));
                      }}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="10 digit phone number"
                      disabled={loading}
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={PHONE_MAX_DIGITS}
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    {phoneHint && (
                      <div className="text-xs font-semibold text-red-600">
                        {phoneHint}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || loading || !isDirty}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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