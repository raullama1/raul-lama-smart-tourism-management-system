import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AgencyAuthLayout from "../../components/agency/AgencyAuthLayout";
import { createAgencySupportTicket } from "../../api/agencySupportApi";

function Chevron({ open }) {
  return (
    <span
      className={[
        "inline-block transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
    >
      ⌄
    </span>
  );
}

function Field({ label, children, error }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export default function AgencyHelpPage() {
  const topRef = useRef(null);

  const faqs = useMemo(
    () => [
      {
        q: "How to register my agency?",
        a: "Go to Create Account in the sidebar, fill in Agency Name, Email, Contact Number, Address, PAN/VAT, and Password, then select Create Account.",
      },
      {
        q: "How to add a tour?",
        a: "After logging in, navigate to Tours > Add New, then provide details such as title, location, price, type, itinerary, and images, and save.",
      },
      {
        q: "How to approve bookings?",
        a: "Open Bookings, review pending requests, and choose Approve or Decline. Customers are notified automatically.",
      },
      {
        q: "How to contact support?",
        a: "Use the Contact Support form on this page. For urgent issues, email support@smarttourism.com.",
      },
    ],
    []
  );

  const [openIdx, setOpenIdx] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [topMessage, setTopMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const update = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setTopError("");
    setTopMessage("");
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const markTouched = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const addFieldError = (map, key, msg) => {
    if (!map[key]) map[key] = [];
    map[key].push(msg);
  };

  const validate = () => {
    const f = {};
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!fullName) addFieldError(f, "fullName", "Full Name is required.");

    if (!email) addFieldError(f, "email", "Email is required.");
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      addFieldError(f, "email", "Enter a valid email.");

    if (!subject) addFieldError(f, "subject", "Subject is required.");

    if (!message) addFieldError(f, "message", "Message is required.");
    if (message && message.length < 10)
      addFieldError(f, "message", "Message is too short.");

    return f;
  };

  const getFieldError = (key) => {
    if (!touched[key]) return null;
    const msgs = fieldErrors[key];
    if (!msgs || msgs.length === 0) return null;
    return msgs[0];
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      subject: true,
      message: true,
    });

    const errs = validate();
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      setTopError("Please fix the highlighted fields and try again.");
      scrollToTop();
      return;
    }

    try {
      setSubmitting(true);
      setTopError("");
      setTopMessage("");

      const res = await createAgencySupportTicket({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setTopMessage(res?.message || "Submitted successfully.");
      setForm({ fullName: "", email: "", subject: "", message: "" });
      setTouched({});
      setFieldErrors({});
      scrollToTop();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit issue.";
      const apiErrors = Array.isArray(err?.response?.data?.errors)
        ? err.response.data.errors
        : [];

      const mapped = {};
      (apiErrors.length ? apiErrors : [msg]).forEach((m) => {
        const low = String(m || "").toLowerCase();
        if (low.includes("full name")) addFieldError(mapped, "fullName", m);
        else if (low.includes("email")) addFieldError(mapped, "email", m);
        else if (low.includes("subject")) addFieldError(mapped, "subject", m);
        else if (low.includes("message")) addFieldError(mapped, "message", m);
      });

      setFieldErrors((p) => ({ ...p, ...mapped }));
      setTopError(msg);
      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AgencyAuthLayout>
      {/* Make whole page container wider */}
      <div
        ref={topRef}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8"
      >
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Help & Support</h1>
          <p className="mt-1 text-sm text-gray-600">
            If you are facing issues with login, tour management, bookings, or
            payments, use the options below.
          </p>
        </div>

        {topError ? (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {topError}
          </div>
        ) : null}

        {topMessage ? (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {topMessage}
          </div>
        ) : null}

        {/* Give FAQs more width than Quick Links */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <div className="rounded-2xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-900">FAQs</div>

            <div className="mt-4 space-y-3">
              {faqs.map((item, idx) => {
                const open = idx === openIdx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIdx((p) => (p === idx ? -1 : idx))}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <span>{item.q}</span>
                      <Chevron open={open} />
                    </button>

                    {open ? (
                      <div className="px-4 pb-4">
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-900">
                          {item.a}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-900">
                Contact Support
              </div>

              <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full Name" error={getFieldError("fullName")}>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      onBlur={() => markTouched("fullName")}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm"
                      placeholder="Enter Full Name"
                    />
                  </Field>

                  <Field label="Email" error={getFieldError("email")}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      onBlur={() => markTouched("email")}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm"
                      placeholder="Enter Email"
                    />
                  </Field>
                </div>

                <Field label="Subject" error={getFieldError("subject")}>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    onBlur={() => markTouched("subject")}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="Enter Subject"
                  />
                </Field>

                <Field label="Message" error={getFieldError("message")}>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    onBlur={() => markTouched("message")}
                    className="w-full min-h-[180px] px-3 py-3 rounded-xl border border-gray-200 text-sm resize-none"
                    placeholder="Enter Message"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-60"
                >
                  <span>➤</span>
                  {submitting ? "Submitting..." : "Submit Issue"}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-900">
                Quick Links
              </div>

              <div className="mt-3 space-y-2">
                <Link
                  to="/agency/login"
                  className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <span>↪</span> Login
                </Link>

                <Link
                  to="/agency/register"
                  className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <span>＋</span> Create Account
                </Link>

                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <span>📄</span> User Guide
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-900">
                Support Email
              </div>
              <p className="mt-2 text-sm text-gray-600">
                For urgent support, contact{" "}
                <span className="text-emerald-800 font-semibold">
                  support@smarttourism.com
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AgencyAuthLayout>
  );
}
