// client/src/components/public/BlogCard.jsx
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

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
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">
          {blog.title}
        </h3>

        <p className="mt-1 text-gray-600 text-xs md:text-sm line-clamp-2">
          {blog.excerpt}
        </p>

        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span className="line-clamp-1">{blog.agency}</span>
          <span>{blog.date}</span>
        </div>

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

    const gapStr = getComputedStyle(container).gap || getComputedStyle(container).columnGap || "0";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseBlogs.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !dims.ready || baseBlogs.length === 0) return;

    destroyDraggable();

    const single = getSingleWidth();

    // Start in the middle copy
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                // key must be unique in triple set
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
