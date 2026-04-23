// client/src/components/public/BlogCard.jsx
import { useNavigate, Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Draggable } from "gsap/all";
import { toPublicImageUrl } from "../../utils/publicImageUrl";

gsap.registerPlugin(Draggable);

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
    <div className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
      <div className="relative h-44 w-full overflow-hidden md:h-48">
        <img
          src={resolveImageUrl(blog.image || blog.image_url)}
          alt={blog.title}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_BLOG_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900 md:text-lg">
          {blog.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {plainPreview(blog.excerpt, 150)}
        </p>

        <div className="mt-4 flex justify-between gap-3 text-xs text-slate-500 md:text-sm">
          <span className="line-clamp-1">{blog.agency}</span>
          <span>{blog.date}</span>
        </div>

        {blog.type ? (
          <div className="mt-4">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {blog.type}
            </span>
          </div>
        ) : null}

        <button
          onClick={handleReadMore}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-800 md:text-base"
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
      duration: 0.38,
      ease: "power2.out",
      onUpdate: applyWrap,
      onComplete: applyWrap,
    });
  };

  return (
    <section className="relative py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-4 md:mb-7">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            {sectionTitle}
          </h2>

          <Link
            to={viewAllLink}
            className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-800 md:text-sm"
          >
            View All
          </Link>
        </div>

        <div className="relative md:px-10">
          <button
            onClick={() => moveBy(+Math.min(340, dims.itemW + dims.gap))}
            className="absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all hover:scale-105 md:inline-flex"
            type="button"
            aria-label="Previous"
            title="Previous"
          >
            <FaChevronLeft size={16} />
          </button>

          <button
            onClick={() => moveBy(-Math.min(340, dims.itemW + dims.gap))}
            className="absolute -right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all hover:scale-105 md:inline-flex"
            type="button"
            aria-label="Next"
            title="Next"
          >
            <FaChevronRight size={16} />
          </button>

          <button
            onClick={() => moveBy(+Math.min(340, dims.itemW + dims.gap))}
            className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all hover:scale-105 md:hidden"
            type="button"
            aria-label="Previous"
            title="Previous"
          >
            <FaChevronLeft size={14} />
          </button>

          <button
            onClick={() => moveBy(-Math.min(340, dims.itemW + dims.gap))}
            className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all hover:scale-105 md:hidden"
            type="button"
            aria-label="Next"
            title="Next"
          >
            <FaChevronRight size={14} />
          </button>

          <div className="overflow-hidden rounded-[1.8rem] bg-white/70 p-2 md:p-3">
            <div
              ref={containerRef}
              className="flex gap-4 md:gap-5"
              style={{ width: "max-content", alignItems: "stretch" }}
            >
              {tripled.map((blog, idx) => (
                <motion.div
                  key={`${blog.id}-${idx}`}
                  className="flex-shrink-0 w-[18rem] sm:w-[22rem] md:w-[27rem] lg:w-[30rem]"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.42, delay: (idx % 5) * 0.03 }}
                >
                  <BlogCard blog={blog} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}