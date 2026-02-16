// client/src/pages/agency/AgencyRegisterPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import AgencyAuthLayout from "../../components/agency/AgencyAuthLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import {
  requestAgencySignupCode,
  checkAgencyAvailability,
} from "../../api/agencyAuthApi";

function InlineSpinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
  );
}

export default function AgencyRegisterPage() {
  const { register } = useAgencyAuth();
  const navigate = useNavigate();
  const topRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneDigits: "",
    address: "",
    pan_vat: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [topMessage, setTopMessage] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [availability, setAvailability] = useState({
    loading: false,
    taken: { name: false, email: false, phone: false, pan_vat: false },
    checked: { name: false, email: false, phone: false, pan_vat: false },
  });

  const debounceRef = useRef(null);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const update = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setTopMessage("");
    setTopError("");
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

    if (
      k === "name" ||
      k === "email" ||
      k === "phoneDigits" ||
      k === "pan_vat"
    ) {
      setAvailability((p) => ({
        ...p,
        checked: { ...p.checked, [k === "phoneDigits" ? "phone" : k]: false },
      }));
    }
  };

  const markTouched = (k) => setTouched((p) => ({ ...p, [k]: true }));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((p) => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const passwordRules = useMemo(
    () => [
      { test: /.{8,}/, message: "At least 8 characters" },
      { test: /[A-Z]/, message: "At least one uppercase letter (A-Z)" },
      { test: /[a-z]/, message: "At least one lowercase letter (a-z)" },
      { test: /[0-9]/, message: "At least one number (0-9)" },
      { test: /[^A-Za-z0-9]/, message: "At least one special character" },
    ],
    []
  );

  const passwordChecks = passwordRules.map((r) => ({
    message: r.message,
    ok: r.test.test(form.password),
  }));

  const missingPasswordRules = passwordChecks
    .filter((c) => !c.ok)
    .map((c) => c.message);

  const isPasswordStrong = missingPasswordRules.length === 0;

  const setOneFieldError = (key, msg) => {
    setFieldErrors((p) => ({ ...p, [key]: [msg] }));
  };

  const addFieldError = (map, key, msg) => {
    if (!map[key]) map[key] = [];
    map[key].push(msg);
  };

  const validateAll = () => {
    const f = {};

    const name = form.name.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const panVat = form.pan_vat.trim();
    const code = form.verificationCode.trim();

    if (!name) addFieldError(f, "name", "Agency Name is required.");

    if (!email) addFieldError(f, "email", "Email is required.");
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      addFieldError(f, "email", "Enter a valid email.");

    if (!code)
      addFieldError(f, "verificationCode", "Verification Code is required.");
    if (code && code.length !== 6)
      addFieldError(f, "verificationCode", "Code must be 6 digits.");

    if (!form.phoneDigits)
      addFieldError(f, "phoneDigits", "Contact Number is required.");
    if (form.phoneDigits && form.phoneDigits.length !== 10) {
      addFieldError(
        f,
        "phoneDigits",
        "Contact Number must be exactly 10 digits."
      );
    }

    if (!address) addFieldError(f, "address", "Address is required.");
    if (address && address.length < 5)
      addFieldError(f, "address", "Address is too short.");

    if (!panVat) addFieldError(f, "pan_vat", "PAN/VAT is required.");
    if (panVat && panVat.length !== 9)
      addFieldError(f, "pan_vat", "PAN/VAT must be exactly 9 digits.");

    if (!form.password) addFieldError(f, "password", "Password is required.");
    if (form.password && !isPasswordStrong) {
      addFieldError(f, "password", "Password must include:");
      missingPasswordRules.forEach((r) => addFieldError(f, "password", r));
    }

    if (!form.confirmPassword)
      addFieldError(f, "confirmPassword", "Confirm Password is required.");
    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      addFieldError(f, "confirmPassword", "Passwords do not match.");
    }

    return f;
  };

  const getFieldError = (key) => {
    if (!touched[key]) return null;
    const msgs = fieldErrors[key];
    if (!msgs || msgs.length === 0) return null;
    return msgs[0];
  };

  const getAllTouchedErrorsCount = (errs) => Object.keys(errs || {}).length;

  const shouldCheck = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phoneDigits = form.phoneDigits.trim();
    const panVat = form.pan_vat.trim();

    const okName = name.length >= 2;
    const okEmail = /^\S+@\S+\.\S+$/.test(email);
    const okPhone = phoneDigits.length === 10;
    const okPan = panVat.length === 9;

    return { okName, okEmail, okPhone, okPan };
  };

  useEffect(() => {
    const { okName, okEmail, okPhone, okPan } = shouldCheck();

    const payload = {};
    if (okName) payload.name = form.name.trim();
    if (okEmail) payload.email = form.email.trim();
    if (okPhone) payload.phone = form.phoneDigits.trim();
    if (okPan) payload.pan_vat = form.pan_vat.trim();

    const hasAny = Object.keys(payload).length > 0;
    if (!hasAny) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setAvailability((p) => ({ ...p, loading: true }));

        const res = await checkAgencyAvailability(payload);

        setAvailability(() => ({
          loading: false,
          taken: {
            name: !!res?.taken?.name,
            email: !!res?.taken?.email,
            phone: !!res?.taken?.phone,
            pan_vat: !!res?.taken?.pan_vat,
          },
          checked: {
            name: okName,
            email: okEmail,
            phone: okPhone,
            pan_vat: okPan,
          },
        }));

        if (okEmail && res?.taken?.email) {
          setFieldErrors((prev) => ({
            ...prev,
            email: ["Email is already registered."],
          }));
        }
        if (okPhone && res?.taken?.phone) {
          setFieldErrors((prev) => ({
            ...prev,
            phoneDigits: ["Contact Number is already registered."],
          }));
        }
        if (okPan && res?.taken?.pan_vat) {
          setFieldErrors((prev) => ({
            ...prev,
            pan_vat: ["PAN/VAT is already registered."],
          }));
        }
        if (okName && res?.taken?.name) {
          setFieldErrors((prev) => ({
            ...prev,
            name: ["Agency Name is already registered."],
          }));
        }
      } catch {
        setAvailability((p) => ({ ...p, loading: false }));
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.name, form.email, form.phoneDigits, form.pan_vat]);

  const statusIcon = (key) => {
    const mapKey = key === "phoneDigits" ? "phone" : key;

    const val =
      key === "name"
        ? form.name.trim()
        : key === "email"
        ? form.email.trim()
        : key === "phoneDigits"
        ? form.phoneDigits.trim()
        : form.pan_vat.trim();

    const formatOk =
      key === "name"
        ? val.length >= 2
        : key === "email"
        ? /^\S+@\S+\.\S+$/.test(val)
        : key === "phoneDigits"
        ? val.length === 10
        : val.length === 9;

    if (!val || !formatOk) return null;

    if (availability.loading && availability.checked[mapKey]) {
      return <InlineSpinner />;
    }

    if (!availability.checked[mapKey]) return null;

    const taken = availability.taken[mapKey];
    if (taken) return <FiXCircle className="text-red-600" size={18} />;

    return <FiCheckCircle className="text-emerald-700" size={18} />;
  };

  const handleSendCode = async () => {
    const email = form.email.trim();

    setTouched((p) => ({ ...p, email: true }));
    setTopError("");
    setTopMessage("");

    if (!email) {
      setOneFieldError("email", "Email is required to send verification code.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setOneFieldError("email", "Enter a valid email.");
      return;
    }

    if (availability.checked.email && availability.taken.email) {
      setOneFieldError("email", "Email is already registered.");
      return;
    }

    try {
      setSendingCode(true);
      setFieldErrors((p) => {
        const next = { ...p };
        delete next.email;
        return next;
      });

      const res = await requestAgencySignupCode(email);

      setCodeSent(true);
      setTimeLeft(60);
      setTopMessage(
        res?.message || "Verification code sent. Code is valid for 60 seconds."
      );
      scrollToTop();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to send verification code.";
      setOneFieldError("email", msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      phoneDigits: true,
      address: true,
      pan_vat: true,
      verificationCode: true,
      password: true,
      confirmPassword: true,
    });

    setTopError("");
    setTopMessage("");

    const errs = validateAll();

    if (availability.checked.name && availability.taken.name)
      addFieldError(errs, "name", "Agency Name is already registered.");
    if (availability.checked.email && availability.taken.email)
      addFieldError(errs, "email", "Email is already registered.");
    if (availability.checked.phone && availability.taken.phone)
      addFieldError(errs, "phoneDigits", "Contact Number is already registered.");
    if (availability.checked.pan_vat && availability.taken.pan_vat)
      addFieldError(errs, "pan_vat", "PAN/VAT is already registered.");

    setFieldErrors(errs);

    if (getAllTouchedErrorsCount(errs) > 0) {
      setTopError("Please fix the highlighted fields and try again.");
      scrollToTop();
      return;
    }

    try {
      setSubmitting(true);

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phoneDigits,
        address: form.address.trim(),
        pan_vat: form.pan_vat.trim(),
        password: form.password,
        verificationCode: form.verificationCode.trim(),
      });

      navigate("/agency/login", {
        state: {
          toast: {
            type: "success",
            message: "Agency registered successfully. Please login to continue.",
          },
        },
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to create agency account.";
      setTopError(msg);
      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthLayout>
      <div
        ref={topRef}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 grid place-items-center">
            <FiUserPlus className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Agency Registration
            </h1>
            <p className="text-sm text-gray-500">
              Smart Tourism Nepal - National Wide
            </p>
          </div>
        </div>

        {topError && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {topError}
          </div>
        )}

        {topMessage && (
          <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {topMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Agency Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                onBlur={() => markTouched("name")}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm"
                placeholder="Agency Name"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                {statusIcon("name")}
              </div>
            </div>
            {getFieldError("name") && (
              <p className="text-xs text-red-600">{getFieldError("name")}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm"
                  placeholder="info@example.com.np"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  {statusIcon("email")}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || timeLeft > 0}
                className="h-11 px-4 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
              >
                {sendingCode
                  ? "Sending..."
                  : timeLeft > 0
                  ? `Wait ${timeLeft}s`
                  : codeSent
                  ? "Resend"
                  : "Send Code"}
              </button>
            </div>
            {getFieldError("email") && (
              <p className="text-xs text-red-600">{getFieldError("email")}</p>
            )}
            {codeSent && (
              <p className="text-xs text-emerald-700">
                Code sent. Valid for 60 seconds.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              type="text"
              value={form.verificationCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                update("verificationCode", v);
              }}
              onBlur={() => markTouched("verificationCode")}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm tracking-[0.25em]"
              placeholder="Enter 6-digit code"
            />
            {getFieldError("verificationCode") && (
              <p className="text-xs text-red-600">
                {getFieldError("verificationCode")}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <div className="flex">
              <div className="h-11 px-3 rounded-l-xl border border-gray-200 bg-gray-50 text-sm flex items-center text-gray-700">
                +977
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.phoneDigits}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                    update("phoneDigits", v);
                  }}
                  onBlur={() => markTouched("phoneDigits")}
                  className="w-full h-11 px-3 pr-10 rounded-r-xl border border-l-0 border-gray-200 text-sm"
                  placeholder="10 digits"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  {statusIcon("phoneDigits")}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Enter 10 digits only (no +977).
            </p>
            {getFieldError("phoneDigits") && (
              <p className="text-xs text-red-600">
                {getFieldError("phoneDigits")}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              onBlur={() => markTouched("address")}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm"
              placeholder="Kathmandu Metropolitan City, Bagmati Province, Nepal"
            />
            {getFieldError("address") && (
              <p className="text-xs text-red-600">{getFieldError("address")}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">PAN/VAT</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={form.pan_vat}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                  update("pan_vat", v);
                }}
                onBlur={() => markTouched("pan_vat")}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm"
                placeholder="9 digits"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                {statusIcon("pan_vat")}
              </div>
            </div>
            {getFieldError("pan_vat") && (
              <p className="text-xs text-red-600">{getFieldError("pan_vat")}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                onBlur={() => markTouched("password")}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm"
                placeholder="Create a strong password"
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

            <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-600 mb-1">Must include:</p>
              <ul className="space-y-1">
                {passwordChecks.map((r, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-1 text-xs ${
                      r.ok ? "text-emerald-700" : "text-gray-500"
                    }`}
                  >
                    <span>{r.ok ? "✔" : "•"}</span>
                    <span>{r.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            {getFieldError("password") && (
              <p className="text-xs text-red-600">
                {getFieldError("password")}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm"
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {getFieldError("confirmPassword") && (
              <p className="text-xs text-red-600">
                {getFieldError("confirmPassword")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] md:text-xs text-gray-600">
              Already have account?{" "}
              <Link
                to="/agency/login"
                className="text-emerald-700 font-medium hover:underline"
              >
                Login
              </Link>
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:scale-[1.02] active:scale-100 transition-transform disabled:opacity-60"
            >
              <FiUserPlus />
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </div>

          <div className="pt-2 text-[10px] md:text-[11px] text-gray-500 flex flex-wrap justify-center gap-4">
            <span>• Nepal Only</span>
            <span>• NPR pricing</span>
            <span>• NPR invoices</span>
            <span>• Local support</span>
          </div>
        </form>
      </div>
    </AgencyAuthLayout>
  );
}
