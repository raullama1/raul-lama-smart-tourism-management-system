// client/src/components/public/BlogCard.jsx
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

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

function plainPreview(text, max = 140) {
  const clean = String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[•-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
}

export function BlogCard({ blog }) {
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate(`/blogs/${blog.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={resolveImageUrl(blog.image)}
          alt={blog.title}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_BLOG_IMAGE;
          }}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">
          {blog.title}
        </h3>

        <p className="mt-1 text-gray-600 text-xs md:text-sm line-clamp-3">
          {plainPreview(blog.excerpt, 150)}
        </p>

        <div className="mt-2 text-xs text-gray-500 flex justify-between gap-3">
          <span className="line-clamp-1">{blog.agency}</span>
          <span>{blog.date}</span>
        </div>

        {blog.type ? (
          <div className="mt-3">
            <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {blog.type}
            </span>
          </div>
        ) : null}

        <button
          onClick={handleReadMore}
          className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-medium hover:scale-105 hover:shadow-md transition-all"
          type="button"
        >
          Read More
        </button>
      </div>
    </div>
  );
}

export function BlogCardSection({
  blogs,
  sectionTitle = "Latest Blogs",
  viewAllLink = "#",
}) {
  const containerRef = useRef(null);
  const draggableRef = useRef(null);

  const [dims, setDims] = useState({ itemW: 520, gap: 20, ready: false });

  const baseBlogs = Array.isArray(blogs) ? blogs : [];
  const tripled = useMemo(() => {
    if (baseBlogs.length === 0) return [];
    return [...baseBlogs, ...baseBlogs, ...baseBlogs];
  }, [baseBlogs]);

  const measure = () => {
    const container = containerRef.current;
    if (!container) return;

    const first = container.children?.[0];
    if (!first) return;

    const itemW = first.getBoundingClientRect().width || 520;
    const gapStr =
      getComputedStyle(container).gap ||
      getComputedStyle(container).columnGap ||
      "0";
    const gap = Number.parseFloat(gapStr) || 0;

    setDims({ itemW, gap, ready: true });
  };

  const getSingleWidth = () => {
    const count = baseBlogs.length;
    return count * (dims.itemW + dims.gap);
  };

  const wrapX = (x) => {
    const single = getSingleWidth();
    if (!single || baseBlogs.length === 0) return x;
    const wrap = gsap.utils.wrap(-2 * single, 0);
    return wrap(x);
  };

  const applyWrap = () => {
    const container = containerRef.current;
    if (!container) return;
    const x = gsap.getProperty(container, "x");
    gsap.set(container, { x: wrapX(Number(x)) });
  };

  const destroyDraggable = () => {
    if (draggableRef.current) {
      draggableRef.current.kill();
      draggableRef.current = null;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || baseBlogs.length === 0) return;

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(container);

    return () => ro.disconnect();
  }, [baseBlogs.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !dims.ready || baseBlogs.length === 0) return;

    destroyDraggable();

    const single = getSingleWidth();

    gsap.set(container, { x: -single });

    draggableRef.current = Draggable.create(container, {
      type: "x",
      inertia: true,
      dragResistance: 0.12,
      allowContextMenu: true,
      onPress() {
        container.style.cursor = "grabbing";
      },
      onRelease() {
        container.style.cursor = "grab";
      },
      onDrag: applyWrap,
      onThrowUpdate: applyWrap,
    })[0];

    container.style.cursor = "grab";

    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        moveBy(+Math.min(340, dims.itemW + dims.gap));
      } else if (e.key === "ArrowRight") {
        moveBy(-Math.min(340, dims.itemW + dims.gap));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      destroyDraggable();
      container.style.cursor = "";
    };
  }, [dims.ready, dims.itemW, dims.gap, baseBlogs.length]);

  const moveBy = (delta) => {
    const container = containerRef.current;
    if (!container) return;

    gsap.to(container, {
      x: `+=${delta}`,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: applyWrap,
      onComplete: applyWrap,
    });
  };

  return (
    <section className="bg-[#e6f4ec] py-8 md:py-10 relative">
      <div className="max-w-6xl mx-auto px-4 md:px-6 relative">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {sectionTitle}
          </h2>

          <a
            href={viewAllLink}
            className="px-4 py-2 rounded-md bg-emerald-700 text-white text-xs md:text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            View All
          </a>
        </div>

        <button
          onClick={() => moveBy(+Math.min(340, dims.itemW + dims.gap))}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
          type="button"
          aria-label="Previous"
          title="Previous"
        >
          <FaChevronLeft size={20} />
        </button>

        <button
          onClick={() => moveBy(-Math.min(340, dims.itemW + dims.gap))}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
          type="button"
          aria-label="Next"
          title="Next"
        >
          <FaChevronRight size={20} />
        </button>

        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-5 select-none"
            style={{ width: "max-content", alignItems: "stretch" }}
          >
            {tripled.map((blog, idx) => (
              <div
                key={`${blog.id}-${idx}`}
                className="flex-shrink-0 w-[470px] md:w-[500px] lg:w-[520px]"
              >
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
