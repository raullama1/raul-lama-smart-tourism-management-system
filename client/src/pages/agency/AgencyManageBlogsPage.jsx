// client/src/pages/agency/AgencyManageBlogsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSend,
  FiBold,
  FiItalic,
  FiList,
  FiImage,
  FiUploadCloud,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiMessageSquare,
  FiCalendar,
  FiLayers,
  FiStar,
  FiArrowUpRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import {
  fetchAgencyBlogs,
  updateAgencyBlog,
  deleteAgencyBlog,
} from "../../api/agencyBlogsApi";
import { toPublicImageUrl } from "../../utils/publicImageUrl";

const BLOG_TYPES = [
  "Adventure",
  "Nature",
  "Heritage",
  "Religious",
  "Wildlife",
];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const FALLBACK_BLOG_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <rect width="1200" height="700" fill="#dff3e7"/>
      <rect x="80" y="80" width="1040" height="540" rx="28" fill="#c8ead5"/>
      <circle cx="260" cy="230" r="56" fill="#9fd3b2"/>
      <path d="M170 500l170-170 120 115 155-165 225 220H170z" fill="#77b790"/>
      <text x="600" y="610" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#2f6f53">
        Smart Tourism Blog
      </text>
    </svg>
  `);

function resolveImageUrl(value) {
  return toPublicImageUrl(value) || FALLBACK_BLOG_IMAGE;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInlineMarkdown(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return safe;
}

function buildExcerptPreviewHtml(text) {
  const lines = String(text || "").trim().split(/\r?\n/);
  const parts = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      parts.push('<div class="h-4"></div>');
      continue;
    }

    const bulletMatch = line.match(/^(?:•|-)\s+(.*)$/);

    if (bulletMatch) {
      parts.push(
        `<div class="leading-7 text-slate-700">&bull; ${renderInlineMarkdown(
          bulletMatch[1]
        )}</div>`
      );
      continue;
    }

    parts.push(
      `<div class="leading-7 text-slate-700">${renderInlineMarkdown(line)}</div>`
    );
  }

  return parts.join("");
}

function validateImageFile(file) {
  if (!file) return "";

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "Please upload a PNG, JPG, JPEG, or WEBP image.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Image size must be ${MAX_IMAGE_SIZE_MB}MB or less.`;
  }

  return "";
}

function ModalShell({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  busy = false,
  maxWidth = "max-w-6xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
        onClick={busy ? undefined : onClose}
      />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
          <div
            className={[
              "relative w-full overflow-hidden rounded-[30px] border border-white/20 bg-white/95 shadow-[0_30px_100px_rgba(2,6,23,0.28)] backdrop-blur-xl",
              maxWidth,
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 top-0 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />
              <div className="absolute right-0 top-16 h-52 w-52 rounded-full bg-teal-200/40 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-sky-200/30 blur-3xl" />
            </div>

            <div className="relative flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-5 sm:px-7">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                  <FiStar size={12} />
                  Blog Editor
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={busy ? undefined : onClose}
                disabled={busy}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="relative max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
              {children}
            </div>

            {footer ? (
              <div className="relative border-t border-slate-200/70 bg-white/80 px-5 py-4 sm:px-7">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditBlogModal({ open, blog, onClose, onSaved, token }) {
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [form, setForm] = useState({
    title: "",
    type: "Adventure",
    content: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!blog) return;

    setForm({
      title: blog.title || "",
      type: blog.type || "Adventure",
      content: blog.content || "",
    });
    setImageFile(null);
    setError("");
    setSuccess("");
    setPreviewOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [blog]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [imageFile]);

  const excerptPreviewHtml = useMemo(
    () => buildExcerptPreviewHtml(form.content),
    [form.content]
  );

  if (!open || !blog) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyWrap = (prefix, suffix = prefix) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const current = form.content || "";
    const selected = current.slice(start, end);
    const wrapped = `${prefix}${selected}${suffix}`;
    const nextValue = current.slice(0, start) + wrapped + current.slice(end);

    updateField("content", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const applyList = () => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const current = form.content || "";
    const selected = current.slice(start, end);

    const lines = selected
      ? selected.split("\n").map((line) => `• ${line}`)
      : ["• "];

    const replacement = lines.join("\n");
    const nextValue =
      current.slice(0, start) + replacement + current.slice(end);

    updateField("content", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + replacement.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const clearImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setValidatedImage = (file) => {
    const validationMessage = validateImageFile(file);

    if (validationMessage) {
      setError(validationMessage);
      clearImage();
      return;
    }

    setError("");
    setImageFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidatedImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setValidatedImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      setError("Blog title is required.");
      return;
    }

    if (!form.type) {
      setError("Blog type is required.");
      return;
    }

    if (!content) {
      setError("Blog content is required.");
      return;
    }

    const imageValidationMessage = validateImageFile(imageFile);
    if (imageValidationMessage) {
      setError(imageValidationMessage);
      return;
    }

    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append("title", title);
      payload.append("type", form.type);
      payload.append("content", content);

      if (imageFile) {
        payload.append("image", imageFile);
      }

      await updateAgencyBlog(blog.id, payload, token);

      setSuccess("Blog updated successfully.");
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update blog.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title="Edit Blog"
      subtitle="Refine your content, refresh the image, and publish a cleaner version."
      onClose={onClose}
      busy={submitting}
      maxWidth="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Blog Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Write an engaging title..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition duration-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  >
                    {BLOG_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyWrap("**")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <FiBold size={16} />
                  Bold
                </button>

                <button
                  type="button"
                  onClick={() => applyWrap("*")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <FiItalic size={16} />
                  Italic
                </button>

                <button
                  type="button"
                  onClick={applyList}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <FiList size={16} />
                  List
                </button>
              </div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Content
              </label>

              <textarea
                ref={contentRef}
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Start writing your blog content here..."
                className="min-h-[300px] w-full rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm font-medium text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_35%)] opacity-90" />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPreviewOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white/90 px-4 py-3.5 text-left transition duration-200 hover:border-emerald-200 hover:bg-white"
                >
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                      Live Preview
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {previewOpen ? "Hide" : "Show"} how your content will look.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {previewOpen ? "Collapse" : "Expand"}
                    {previewOpen ? (
                      <FiChevronUp size={16} />
                    ) : (
                      <FiChevronDown size={16} />
                    )}
                  </span>
                </button>

                {previewOpen ? (
                  <div className="mt-4 rounded-[24px] border border-white/70 bg-white/95 p-5 shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <FiFileText size={20} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black text-slate-900">
                          {form.title || "Your blog title"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {form.type || "Blog type"}
                        </p>
                      </div>
                    </div>

                    {excerptPreviewHtml ? (
                      <div
                        className="prose prose-sm max-w-none rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm"
                        dangerouslySetInnerHTML={{ __html: excerptPreviewHtml }}
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-400">
                        Your preview will appear here as you write.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-5">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Replace Image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="group relative mb-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/15 via-transparent to-emerald-400/10" />
                <img
                  src={previewUrl || resolveImageUrl(blog.image_url)}
                  alt={blog.title}
                  className="h-60 w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_BLOG_IMAGE;
                  }}
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                className={[
                  "cursor-pointer rounded-[24px] border border-dashed p-5 transition duration-200",
                  dragActive
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-300 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/70",
                ].join(" ")}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                      {imageFile ? <FiImage size={22} /> : <FiUploadCloud size={22} />}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">
                        {imageFile?.name || "Drag & drop an image here or browse"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        JPG, PNG, WEBP up to {MAX_IMAGE_SIZE_MB}MB
                      </p>
                    </div>
                  </div>

                  {imageFile ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                        setError("");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition duration-200 hover:bg-slate-50"
                    >
                      <FiX size={16} />
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <FiX size={16} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(15,23,42,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiSend size={16} />
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteConfirmModal({ open, blog, onClose, onConfirm, deleting }) {
  if (!open || !blog) return null;

  return (
    <ModalShell
      open={open}
      title="Delete Blog"
      subtitle={`This will permanently remove "${blog.title}" from your account.`}
      onClose={onClose}
      busy={deleting}
      maxWidth="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition duration-200 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiTrash2 size={16} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-slate-600">
        This action cannot be undone.
      </div>
    </ModalShell>
  );
}

function BlogStatCard({ title, value, icon, tone = "emerald" }) {
  const tones = {
    emerald:
      "from-emerald-500/14 via-emerald-400/10 to-white text-emerald-700 border-emerald-100",
    sky: "from-sky-500/14 via-sky-400/10 to-white text-sky-700 border-sky-100",
    violet:
      "from-violet-500/14 via-violet-400/10 to-white text-violet-700 border-violet-100",
  };

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[26px] border bg-gradient-to-br p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.11)]",
        tones[tone],
      ].join(" ")}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_34%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 shadow-sm transition duration-300 group-hover:scale-110">
          {icon}
        </span>
      </div>
    </div>
  );
}

function BlogTableRow({ blog, onEdit, onDelete, index, total }) {
  return (
    <div
      className={[
        "grid items-center gap-4 px-5 py-4 transition duration-200 hover:bg-emerald-50/50 md:grid-cols-[minmax(0,1.9fr)_160px_120px_180px]",
        index !== total - 1 ? "border-b border-slate-200/70" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img
            src={resolveImageUrl(blog.image_url)}
            alt={blog.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_BLOG_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/10 to-transparent" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-black text-slate-900 sm:text-base">
            {blog.title}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              <FiLayers size={12} />
              {blog.type}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 text-sm font-semibold text-slate-600 md:flex">
        <FiCalendar size={15} className="text-emerald-600" />
        {blog.formattedDate}
      </div>

      <div className="hidden md:block">
        <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800">
          {blog.formattedComments}
        </span>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => onEdit(blog)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
        >
          <FiEdit2 size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(blog)}
          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition duration-200 hover:-translate-y-0.5 hover:bg-red-50"
        >
          <FiTrash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  );
}

function BlogMobileCard({ blog, onEdit, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.11)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_35%)]" />
      <div className="relative flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img
            src={resolveImageUrl(blog.image_url)}
            alt={blog.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_BLOG_IMAGE;
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-black text-slate-900">
            {blog.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              <FiLayers size={12} />
              {blog.type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <FiMessageSquare size={12} />
              {blog.formattedComments} comments
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <FiCalendar size={13} />
            {blog.formattedDate}
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onEdit(blog)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition duration-200 hover:border-emerald-200 hover:bg-emerald-50"
        >
          <FiEdit2 size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(blog)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-bold text-red-700 transition duration-200 hover:bg-red-50"
        >
          <FiTrash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  );
}

function AgencyManageBlogsPageContent({ openNotifications }) {
  const navigate = useNavigate();
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [blogs, setBlogs] = useState([]);
  const [summary, setSummary] = useState({ totalComments: 0, totalBlogs: 0 });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [editBlog, setEditBlog] = useState(null);
  const [deleteBlogItem, setDeleteBlogItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
    }, 250);

    return () => clearTimeout(t);
  }, [search]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setPageError("");

      const res = await fetchAgencyBlogs(
        {
          search: query,
          sort,
          page: 1,
          limit: 50,
        },
        token
      );

      setBlogs(res.blogs || []);
      setSummary(res.summary || { totalComments: 0, totalBlogs: 0 });
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadBlogs();
  }, [token, query, sort]);

  const handleDelete = async () => {
    if (!deleteBlogItem) return;

    try {
      setDeleting(true);
      await deleteAgencyBlog(deleteBlogItem.id, token);
      setDeleteBlogItem(null);
      await loadBlogs();
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to delete blog.");
    } finally {
      setDeleting(false);
    }
  };

  const formattedBlogs = useMemo(() => {
    return blogs.map((blog) => ({
      ...blog,
      formattedDate: blog.created_at
        ? new Date(blog.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
      formattedComments: Number(blog.comment_count || 0).toLocaleString("en-US"),
    }));
  }, [blogs]);

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}
    openNotifications?.();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />
        </div>

        <div className="relative border-b border-slate-200/70 px-5 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Tourism Nepal
              </div>

              <div className="mt-4">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Manage Blogs
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenNotifications}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
                aria-label="Notifications"
                title="Notifications"
              >
                <FiBell size={18} />
                {Number(unreadCount || 0) > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-6 min-w-[24px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/agency/blogs/add")}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_32px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <FiPlus size={18} />
                Add New Blog
                <FiArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <BlogStatCard
              title="Total Blogs"
              value={Number(summary.totalBlogs || formattedBlogs.length).toLocaleString("en-US")}
              icon={<FiFileText size={22} />}
              tone="emerald"
            />
            <BlogStatCard
              title="Total Comments"
              value={Number(summary.totalComments || 0).toLocaleString("en-US")}
              icon={<FiMessageSquare size={22} />}
              tone="sky"
            />
          </div>
        </div>

        <div className="relative px-5 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid w-full gap-3 md:grid-cols-[1fr_180px] xl:max-w-3xl">
              <div className="relative">
                <FiSearch
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search blogs by title or content..."
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition duration-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-bold text-emerald-800 xl:w-auto">
              <FiMessageSquare size={16} />
              Total Comments: {Number(summary.totalComments || 0).toLocaleString("en-US")}
            </div>
          </div>

          {pageError ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {pageError}
            </div>
          ) : null}

          <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.05)] md:block">
            <div className="grid grid-cols-[minmax(0,1.9fr)_160px_120px_180px] gap-4 border-b border-slate-200/70 bg-slate-50/90 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-slate-600">
              <div>Title</div>
              <div>Date</div>
              <div>Comments</div>
              <div>Actions</div>
            </div>

            {loading ? (
              <div className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                Loading blogs...
              </div>
            ) : formattedBlogs.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                No blogs found.
              </div>
            ) : (
              formattedBlogs.map((blog, index) => (
                <BlogTableRow
                  key={blog.id}
                  blog={blog}
                  onEdit={setEditBlog}
                  onDelete={setDeleteBlogItem}
                  index={index}
                  total={formattedBlogs.length}
                />
              ))
            )}
          </div>

          <div className="grid gap-4 md:hidden">
            {loading ? (
              <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500">
                Loading blogs...
              </div>
            ) : formattedBlogs.length === 0 ? (
              <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500">
                No blogs found.
              </div>
            ) : (
              formattedBlogs.map((blog) => (
                <BlogMobileCard
                  key={blog.id}
                  blog={blog}
                  onEdit={setEditBlog}
                  onDelete={setDeleteBlogItem}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <EditBlogModal
        open={!!editBlog}
        blog={editBlog}
        token={token}
        onClose={() => setEditBlog(null)}
        onSaved={async () => {
          setEditBlog(null);
          await loadBlogs();
        }}
      />

      <DeleteConfirmModal
        open={!!deleteBlogItem}
        blog={deleteBlogItem}
        deleting={deleting}
        onClose={() => setDeleteBlogItem(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default function AgencyManageBlogsPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyManageBlogsPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}