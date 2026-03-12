// client/src/pages/agency/AgencyAddBlogPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBold,
  FiItalic,
  FiList,
  FiImage,
  FiX,
  FiSend,
  FiUploadCloud,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
} from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import { createAgencyBlog } from "../../api/agencyBlogsApi";

const BLOG_TYPES = [
  "Adventure",
  "Nature",
  "Heritage",
  "Religious",
  "Wildlife",
];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

function buildExcerpt(text) {
  return String(text || "").trim();
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
  const excerpt = buildExcerpt(text);
  if (!excerpt) return "";

  const lines = excerpt.split(/\r?\n/);
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
        `<div class="leading-7 text-slate-700">${"&bull; "}${renderInlineMarkdown(
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
  if (!file) {
    return "Blog image is required.";
  }

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

function AddBlogPageContent({ openNotifications }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [form, setForm] = useState({
    title: "",
    type: "",
    content: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const imageName = imageFile?.name || "";

  const excerptPreviewHtml = useMemo(
    () => buildExcerptPreviewHtml(form.content),
    [form.content]
  );

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

  const handleChooseImage = () => {
    fileInputRef.current?.click();
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

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const content = form.content.trim();
    const type = form.type.trim();
    const imageValidationMessage = validateImageFile(imageFile);

    if (!title) {
      setError("Blog title is required.");
      return;
    }

    if (!type) {
      setError("Please select a blog type.");
      return;
    }

    if (!BLOG_TYPES.includes(type)) {
      setError("Please select a valid blog type.");
      return;
    }

    if (!content) {
      setError("Blog content is required.");
      return;
    }

    if (imageValidationMessage) {
      setError(imageValidationMessage);
      return;
    }

    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append("title", title);
      payload.append("type", type);
      payload.append("content", content);
      payload.append("image", imageFile);

      await createAgencyBlog(payload, token);

      setSuccess("Blog published successfully.");
      setForm({
        title: "",
        type: "",
        content: "",
      });
      clearImage();
      setPreviewOpen(true);

      setTimeout(() => {
        navigate("/agency/blogs/add");
      }, 700);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish blog.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-emerald-100/70 bg-white/80 shadow-[0_20px_80px_-30px_rgba(16,185,129,0.35)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_30%),linear-gradient(135deg,rgba(16,185,129,0.03),rgba(255,255,255,0.4),rgba(245,158,11,0.03))]" />
      </div>

      <div className="relative border-b border-emerald-100/80 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm">
              Tourism Nepal
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Add Blog
            </h1>
          </div>

          <button
            type="button"
            onClick={handleOpenNotifications}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100/80 bg-white/90 text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-100"
            aria-label="Notifications"
            title="Notifications"
          >
            <FiBell size={18} />
            {Number(unreadCount || 0) > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-h-[22px] min-w-[22px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-red-200">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_390px]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Blog Title
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 opacity-0 blur-xl transition duration-500 group-focus-within:opacity-100" />
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Write an engaging title..."
                      className="relative w-full rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Select type</option>
                    {BLOG_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="group rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur transition duration-500 hover:-translate-y-1 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-700">
                    Content
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyWrap("**")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <FiBold size={16} />
                    Bold
                  </button>

                  <button
                    type="button"
                    onClick={() => applyWrap("*")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <FiItalic size={16} />
                    Italic
                  </button>

                  <button
                    type="button"
                    onClick={applyList}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <FiList size={16} />
                    List
                  </button>
                </div>
              </div>

              <div className="relative mt-4">
                <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-gradient-to-br from-emerald-100/30 via-transparent to-teal-100/30 opacity-0 blur-2xl transition duration-500 group-focus-within:opacity-100" />
                <textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Start writing your blog content here..."
                  className="relative min-h-[340px] w-full rounded-[26px] border border-slate-200/80 bg-white/95 px-4 py-4 text-sm font-medium leading-7 text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 sm:px-5 sm:py-5"
                />
              </div>
            </div>

            <div className="group rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur transition duration-500 hover:-translate-y-1 sm:p-5">
              <div className="mb-3">
                <label className="block text-sm font-bold text-slate-700">
                  Upload Image
                </label>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={handleChooseImage}
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
                  "relative overflow-hidden rounded-[26px] border border-dashed px-4 py-5 transition duration-300 sm:px-5 sm:py-6",
                  dragActive
                    ? "border-emerald-400 bg-emerald-50 shadow-[0_20px_50px_-25px_rgba(16,185,129,0.45)]"
                    : "border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50/60",
                ].join(" ")}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_45%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                      {imageFile ? <FiImage size={22} /> : <FiUploadCloud size={22} />}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900 sm:text-lg">
                        {imageName || "Drag & drop an image here or browse"}
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
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition duration-300 hover:border-red-200 hover:text-red-600"
                    >
                      <FiX size={16} />
                      Remove
                    </button>
                  ) : null}
                </div>

                {imagePreviewUrl ? (
                  <div className="relative mt-5 overflow-hidden rounded-[22px] border border-white/80 bg-white/80 shadow-sm">
                    <div className="aspect-[16/8] overflow-hidden">
                      <img
                        src={imagePreviewUrl}
                        alt="Selected blog preview"
                        className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
                {success}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/agency/dashboard")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <FiX size={16} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_-18px_rgba(16,185,129,0.8)] transition duration-300 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FiSend size={16} />
                {submitting ? "Publishing..." : "Publish Blog"}
              </button>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.92))] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
              <button
                type="button"
                onClick={() => setPreviewOpen((prev) => !prev)}
                className="flex w-full items-center justify-between border-b border-slate-100 px-5 py-4 text-left transition duration-300 hover:bg-white/70"
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    Live Preview
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {previewOpen ? "Hide" : "Show"} your blog preview
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                  {previewOpen ? "Close" : "Open"}
                  {previewOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </div>
              </button>

              {previewOpen ? (
                <div className="space-y-5 p-5">
                  <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_35%)]" />
                    {imagePreviewUrl ? (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={imagePreviewUrl}
                          alt="Blog cover preview"
                          className="h-full w-full object-cover transition duration-700 hover:scale-[1.05]"
                        />
                      </div>
                    ) : (
                      <div className="relative grid aspect-[16/10] place-items-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 text-center">
                        <div>
                          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                            <FiImage size={22} />
                          </div>
                          <p className="mt-4 text-sm font-semibold text-slate-500">
                            Cover image preview
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative p-5">
                      {form.type ? (
                        <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                          {form.type}
                        </div>
                      ) : null}

                      <h2 className="mt-3 break-words text-xl font-black leading-tight tracking-tight text-slate-900">
                        {form.title.trim() || "Blog Title Preview"}
                      </h2>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
                    {excerptPreviewHtml ? (
                      <div
                        className="space-y-3 break-words text-sm text-slate-700"
                        dangerouslySetInnerHTML={{ __html: excerptPreviewHtml }}
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                        Blog content preview will appear here
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AgencyAddBlogPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AddBlogPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}