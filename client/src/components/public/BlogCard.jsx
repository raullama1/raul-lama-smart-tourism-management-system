// client/src/components/public/BlogCard.jsx
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useRef, useEffect, useState } from "react";
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

      {/* Blog Image */}
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Blog Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">
          {blog.title}
        </h3>

        <p className="mt-1 text-gray-600 text-xs md:text-sm line-clamp-2">
          {blog.excerpt}
        </p>

        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>{blog.agency}</span>
          <span>{blog.date}</span>
        </div>

        <button
          onClick={handleReadMore}
          className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm md:text-base font-medium hover:scale-105 hover:shadow-md transition-all"
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
  viewAllLink = "#"
}) {
  const containerRef = useRef(null);
  const draggableRef = useRef(null);
  const [itemWidth] = useState(470);
  const gap = 24;

  // Infinite Loop Function
  const loop = (container) => {
    const originalCount = blogs.length;
    const totalWidthSingle = originalCount * (itemWidth + gap);
    const x = gsap.getProperty(container, "x");

    if (x <= -totalWidthSingle) {
      gsap.set(container, { x: x + totalWidthSingle });
    } else if (x >= 0) {
      gsap.set(container, { x: x - totalWidthSingle });
    }
  };

  // GSAP + Draggable Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const originalChildren = Array.from(container.children);
    originalChildren.forEach((item) =>
      container.appendChild(item.cloneNode(true))
    );

    gsap.set(container, { x: 0 });

    draggableRef.current = Draggable.create(container, {
      type: "x",
      inertia: true,
      onDrag: () => loop(container),
      onThrowUpdate: () => loop(container)
    })[0];

    container.addEventListener(
      "pointerdown",
      () => (container.style.cursor = "grabbing")
    );
    container.addEventListener(
      "pointerup",
      () => (container.style.cursor = "grab")
    );

    container.style.cursor = "grab";

    return () => {
      if (draggableRef.current) draggableRef.current.kill();
      const childrenNow = Array.from(container.children);
      childrenNow.slice(originalChildren.length).forEach((el) => el.remove());
      container.style.cursor = "";
    };
  }, [blogs, itemWidth]);

  return (
    <section className="bg-[#e6f4ec] py-8 md:py-10 relative">
      <div className="max-w-6xl mx-auto px-4 md:px-6 relative">

        {/* Section Header */}
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

        {/* Left Arrow */}
        <button
          onClick={() => {
            const container = containerRef.current;
            gsap.to(container, {
              x: "+=300",
              duration: 0.3,
              onUpdate: () => loop(container),
              onComplete: () => loop(container)
            });
          }}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
        >
          <FaChevronLeft size={20} />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => {
            const container = containerRef.current;
            gsap.to(container, {
              x: "-=300",
              duration: 0.3,
              onUpdate: () => loop(container),
              onComplete: () => loop(container)
            });
          }}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
        >
          <FaChevronRight size={20} />
        </button>

        {/* Blog Cards Carousel */}
        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-5 select-none"
            style={{ width: "max-content", alignItems: "stretch" }}
          >
            {blogs.map((blog) => (
              <div
                key={blog.id}
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
