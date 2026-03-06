// client/src/pages/agency/AgencyAddBlogPage.jsx
import { useMemo, useRef, useState } from "react";
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
} from "react-icons/fi";
import AgencySidebar from "../../components/agency/AgencySidebar";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
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
        `<div class="leading-6 text-slate-700">${"&bull; "}${renderInlineMarkdown(
          bulletMatch[1]
        )}</div>`
      );
      continue;
    }

    parts.push(
      `<div class="leading-6 text-slate-700">${renderInlineMarkdown(line)}</div>`
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

export default function AgencyAddBlogPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);
  const { token } = useAgencyAuth();

  const [form, setForm] = useState({
    title: "",
    type: "Adventure",
    content: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const content = form.content.trim();
    const imageValidationMessage = validateImageFile(imageFile);

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
      payload.append("image", imageFile);

      await createAgencyBlog(payload, token);

      setSuccess("Blog published successfully.");
      setForm({
        title: "",
        type: "Adventure",
        content: "",
      });
      clearImage();
      setPreviewOpen(false);

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
    <div className="h-screen overflow-hidden bg-[#dfe9e2]">
      <div className="flex h-full">
        <div className="h-full shrink-0">
          <AgencySidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl rounded-3xl bg-white/70 shadow-sm ring-1 ring-emerald-100">
            <div className="flex items-start justify-between border-b border-emerald-100 px-6 py-5">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Add Blog
                </h1>
              </div>

              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-700"
              >
                <FiBell size={18} />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">
                  3
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="grid gap-5 md:grid-cols-[1fr_240px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Blog Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Write an engaging title..."
                    className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    {BLOG_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Content
                </label>

                <div className="rounded-2xl bg-emerald-50 p-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyWrap("**")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-emerald-100"
                    >
                      <FiBold size={16} />
                      Bold
                    </button>

                    <button
                      type="button"
                      onClick={() => applyWrap("*")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-emerald-100"
                    >
                      <FiItalic size={16} />
                      Italic
                    </button>

                    <button
                      type="button"
                      onClick={applyList}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-emerald-100"
                    >
                      <FiList size={16} />
                      List
                    </button>
                  </div>
                </div>

                <textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Start writing your blog content here..."
                  className="mt-3 min-h-[280px] w-full rounded-2xl border border-emerald-100 bg-white px-4 py-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />

                <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/40"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                        Preview
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Click to {previewOpen ? "hide" : "show"} the live preview.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-amber-100">
                      {previewOpen ? "Close" : "Open"}
                      {previewOpen ? (
                        <FiChevronUp size={16} />
                      ) : (
                        <FiChevronDown size={16} />
                      )}
                    </div>
                  </button>

                  {previewOpen ? (
                    <div className="border-t border-amber-100 px-4 py-4">
                      {excerptPreviewHtml ? (
                        <div
                          className="rounded-xl border border-white/80 bg-white/90 px-4 py-4 text-sm text-slate-700 shadow-sm"
                          dangerouslySetInnerHTML={{ __html: excerptPreviewHtml }}
                        />
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-5 text-sm text-slate-400">
                          Your preview will appear here as you write.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Upload Image
                </label>

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
                    "flex cursor-pointer items-center justify-between rounded-2xl border border-dashed px-4 py-5 transition",
                    dragActive
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-emerald-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      {imageFile ? (
                        <FiImage size={20} />
                      ) : (
                        <FiUploadCloud size={20} />
                      )}
                    </span>

                    <div>
                      <p className="text-lg font-semibold text-slate-800">
                        {imageName || "Drag & drop an image here or browse"}
                      </p>
                      <p className="text-sm text-slate-500">
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
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      <FiX size={16} />
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/agency/dashboard")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiX size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FiSend size={16} />
                  {submitting ? "Publishing..." : "Publish Blog"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}