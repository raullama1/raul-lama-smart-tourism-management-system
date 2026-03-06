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
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AgencySidebar from "../../components/agency/AgencySidebar";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import {
  fetchAgencyBlogs,
  updateAgencyBlog,
  deleteAgencyBlog,
} from "../../api/agencyBlogsApi";

const BLOG_TYPES = [
  "Adventure",
  "Nature",
  "Heritage",
  "Religious",
  "Wildlife",
];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

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
  const raw = String(value || "").trim();
  if (!raw) return FALLBACK_BLOG_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${SERVER_BASE_URL}${raw}`;
  return `${SERVER_BASE_URL}/${raw}`;
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
        `<div class="leading-6 text-slate-700">&bull; ${renderInlineMarkdown(
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
  maxWidth = "max-w-5xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={busy ? undefined : onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={[
            "w-full max-h-[92vh] overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-2xl",
            "flex flex-col",
            maxWidth,
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3 border-b border-emerald-100 px-6 py-5 shrink-0">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={busy ? undefined : onClose}
              disabled={busy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">
            {children}
          </div>

          {footer ? (
            <div className="border-t border-emerald-100 bg-white px-6 py-4 shrink-0">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EditBlogModal({ open, blog, onClose, onSaved, token }) {
  const fileInputRef = useRef(null);
  const contentRef = useRef(null);

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
      subtitle="Update your blog details and save changes."
      onClose={onClose}
      busy={submitting}
      maxWidth="max-w-5xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-[1fr_240px]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-emerald-900/80">
              Blog Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Write an engaging title..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-emerald-900/80">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
          <label className="mb-2 block text-sm font-semibold text-emerald-900/80">
            Content
          </label>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyWrap("**")}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-emerald-50"
              >
                <FiBold size={16} />
                Bold
              </button>

              <button
                type="button"
                onClick={() => applyWrap("*")}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-emerald-50"
              >
                <FiItalic size={16} />
                Italic
              </button>

              <button
                type="button"
                onClick={applyList}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-emerald-50"
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
            className="mt-3 min-h-[260px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-medium text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 shadow-sm">
            <button
              type="button"
              onClick={() => setPreviewOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/40"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Preview
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Click to {previewOpen ? "hide" : "show"} the live preview.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                {previewOpen ? "Close" : "Open"}
                {previewOpen ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </div>
            </button>

            {previewOpen ? (
              <div className="border-t border-emerald-100 px-4 py-4">
                {excerptPreviewHtml ? (
                  <div
                    className="rounded-xl border border-white/80 bg-white/90 px-4 py-4 text-sm text-gray-700 shadow-sm"
                    dangerouslySetInnerHTML={{ __html: excerptPreviewHtml }}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-5 text-sm text-gray-400">
                    Your preview will appear here as you write.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-emerald-900/80">
            Replace Image (optional)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mb-3 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60">
            <img
              src={
                imageFile
                  ? URL.createObjectURL(imageFile)
                  : resolveImageUrl(blog.image_url)
              }
              alt={blog.title}
              className="h-52 w-full object-cover"
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
              "flex cursor-pointer items-center justify-between rounded-2xl border border-dashed px-4 py-5 transition",
              dragActive
                ? "border-emerald-400 bg-emerald-50"
                : "border-emerald-200 bg-white",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                {imageFile ? <FiImage size={20} /> : <FiUploadCloud size={20} />}
              </span>

              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {imageFile?.name || "Drag & drop an image here or browse"}
                </p>
                <p className="text-sm text-gray-500">
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
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-emerald-50"
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
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <FiX size={16} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
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
      subtitle={`Are you sure you want to delete "${blog.title}"? This action cannot be undone.`}
      onClose={onClose}
      busy={deleting}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiTrash2 size={16} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      }
    >
      <div className="text-sm text-gray-600">
        This will permanently remove the selected blog from your account.
      </div>
    </ModalShell>
  );
}

export default function AgencyManageBlogsPage() {
  const navigate = useNavigate();
  const { token } = useAgencyAuth();

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
      console.error("Failed to load agency blogs", err);
      setPageError(err?.response?.data?.message || "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, query, sort]);

  const handleDelete = async () => {
    if (!deleteBlogItem) return;

    try {
      setDeleting(true);
      await deleteAgencyBlog(deleteBlogItem.id, token);
      setDeleteBlogItem(null);
      await loadBlogs();
    } catch (err) {
      console.error("Failed to delete blog", err);
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

  const TABLE_GRID =
    "grid grid-cols-[minmax(0,1.6fr)_170px_120px_190px] gap-4";
  const GLASS_HEADER =
    "border-b border-white/40 bg-white/45 backdrop-blur-md supports-[backdrop-filter]:bg-emerald-100/35";

  return (
    <div className="h-screen overflow-hidden bg-[#dfe9e2]">
      <div className="flex h-full">
        <div className="h-full shrink-0">
          <AgencySidebar />
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-emerald-100 px-6 py-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Manage Blogs
                </h1>
              </div>

              <div className="flex items-center gap-3 self-start">
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-900 transition hover:bg-emerald-50"
                >
                  <FiBell size={18} />
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs font-bold text-white">
                    3
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/agency/blogs/add")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
                >
                  <FiPlus size={18} />
                  Add New Blog
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row">
                  <div className="relative flex-1">
                    <FiSearch
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search blogs..."
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                  </select>
                </div>

                <div className="inline-flex items-center gap-2 self-start rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  <FiMessageSquare size={16} />
                  Total Comments:{" "}
                  {Number(summary.totalComments || 0).toLocaleString("en-US")}
                </div>
              </div>

              {pageError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {pageError}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
                <div
                  className={[
                    TABLE_GRID,
                    GLASS_HEADER,
                    "px-4 py-4 text-sm font-bold text-emerald-900/85",
                  ].join(" ")}
                >
                  <div className="text-left">Title</div>
                  <div className="text-left">Date posted</div>
                  <div className="text-left">Comments</div>
                  <div className="text-left">Actions</div>
                </div>

                {loading ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading blogs...
                  </div>
                ) : formattedBlogs.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    No blogs found.
                  </div>
                ) : (
                  formattedBlogs.map((blog, index) => (
                    <div
                      key={blog.id}
                      className={[
                        TABLE_GRID,
                        "items-center px-4 py-4",
                        index !== formattedBlogs.length - 1
                          ? "border-b border-emerald-100"
                          : "",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                          <FiFileText size={18} />
                        </span>

                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-gray-900">
                            {blog.title}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {blog.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm font-semibold text-gray-700">
                        {blog.formattedDate}
                      </div>

                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900 tabular-nums">
                          {blog.formattedComments}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditBlog(blog)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                        >
                          <FiEdit2 size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteBlogItem(blog)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
                        >
                          <FiTrash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
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
    </div>
  );
}