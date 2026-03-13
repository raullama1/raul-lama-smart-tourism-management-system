// client/src/components/public/HeroSection.jsx
import { useLayoutEffect, useRef } from "react";
import { FaMapMarkerAlt, FaChevronDown } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection({
  onDiscoverToursClick,
  onDiscoverMapClick,
}) {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const imageWrapRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);

  const handleExploreClick = () => {
    const canContinue =
      typeof onDiscoverToursClick === "function" ? onDiscoverToursClick() : true;

    if (canContinue === false) return;

    navigate("/tours");
  };

  const handleMapClick = () => {
    const canContinue =
      typeof onDiscoverMapClick === "function" ? onDiscoverMapClick() : true;

    if (canContinue === false) return;

    navigate("/map");
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const imageWrap = imageWrapRef.current;
    const image = imageRef.current;
    const content = contentRef.current;

    if (!section || !imageWrap || !image || !content) return;

    const ctx = gsap.context(() => {
      gsap.set(content, { y: 0 });
      gsap.set(imageWrap, { y: 0, opacity: 1, scale: 1 });
      gsap.set(image, { yPercent: 0, scale: 1 });

      gsap.to(image, {
        yPercent: 6,
        scale: 1.03,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.9,
        },
      });

      gsap.to(content, {
        y: -10,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.9,
        },
      });

      gsap.fromTo(
        imageWrap,
        { y: 12, opacity: 0, scale: 0.985 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#eef7f1] pt-4 md:pt-6"
    >
      <div className="mx-auto max-w-7xl px-4 pb-10 md:px-6 md:pb-14 lg:pb-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div ref={contentRef} className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 md:text-xs"
            >
              Tourism Nepal
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl lg:text-6xl"
            >
              Discover tours across Nepal with clarity and confidence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg"
            >
              Explore destinations, review tour options, and connect with trusted
              travel agencies across Nepal in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <motion.button
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleExploreClick}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-700 px-7 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(5,150,105,0.18)] transition-all hover:bg-emerald-800 md:text-base"
                type="button"
              >
                Explore Tours
              </motion.button>

              <motion.button
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleMapClick}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-7 py-3 text-sm font-semibold text-emerald-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all hover:bg-emerald-50 md:text-base"
                type="button"
              >
                <span>Discover on Nepal Map</span>
                <FaMapMarkerAlt className="text-base" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-7 hidden items-center gap-2 text-sm text-slate-400 md:flex"
            >
              <FaChevronDown className="animate-bounce" />
              <span>Scroll to explore</span>
            </motion.div>
          </div>

          <div ref={imageWrapRef} className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
              <img
                ref={imageRef}
                src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1600&q=80"
                alt="Nepal mountain travel"
                className="h-[19rem] w-full object-cover md:h-[24rem] lg:h-[32rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}