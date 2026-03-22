// client/src/pages/public/PublicHomePage.jsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NavbarPublic from "../../components/public/NavbarPublic";
import FooterPublic from "../../components/public/FooterPublic";
import HomeContent from "../../components/shared/HomeContent";

const WORDS = ["Explore", "Experience", "Nepal"];

const INITIAL_GAP_MS = 0;
const WORD_VISIBLE_MS = 1100;
const GAP_MS = 220;
const SLIDE_UP_MS = 820;
const INTRO_STORAGE_KEY = "publicHomeIntroShown";

export default function PublicHomePage() {
  const [displayWord, setDisplayWord] = useState(null);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(INTRO_STORAGE_KEY) !== "true";
  });
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
  });
  const timeoutsRef = useRef([]);

  useEffect(() => {
    if (!showIntro) return;

    const timers = [];
    let time = INITIAL_GAP_MS;

    WORDS.forEach((word) => {
      timers.push(
        window.setTimeout(() => {
          setDisplayWord(word);
        }, time)
      );

      timers.push(
        window.setTimeout(() => {
          setDisplayWord(null);
        }, time + WORD_VISIBLE_MS)
      );

      time += WORD_VISIBLE_MS + GAP_MS;
    });

    timers.push(
      window.setTimeout(() => {
        setIntroDone(true);
      }, time)
    );

    timers.push(
      window.setTimeout(() => {
        sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
        setShowIntro(false);
      }, time + SLIDE_UP_MS)
    );

    timeoutsRef.current = timers;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [showIntro]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const body = document.body;
    const html = document.documentElement;

    if (showIntro) {
      const scrollY = window.scrollY || window.pageYOffset;

      body.dataset.scrollY = String(scrollY);

      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      body.style.height = "100%";

      html.style.overflow = "hidden";
      html.style.height = "100%";
    } else {
      const savedScrollY = parseInt(body.dataset.scrollY || "0", 10);

      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.height = "";

      html.style.overflow = "";
      html.style.height = "";

      window.scrollTo(0, savedScrollY);
      delete body.dataset.scrollY;
    }

    return () => {
      const savedScrollY = parseInt(body.dataset.scrollY || "0", 10);

      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.height = "";

      html.style.overflow = "";
      html.style.height = "";

      if (!Number.isNaN(savedScrollY)) {
        window.scrollTo(0, savedScrollY);
      }

      delete body.dataset.scrollY;
    };
  }, [showIntro]);

  return (
    <div className="relative bg-[#071510]">
      <AnimatePresence>
        {showIntro ? (
          <motion.div
            key="public-loader"
            initial={{ top: 0 }}
            animate={introDone ? { top: "-100%" } : { top: 0 }}
            exit={{ top: "-100%" }}
            transition={{
              duration: SLIDE_UP_MS / 1000,
              ease: [0.76, 0, 0.24, 1],
            }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            className="fixed inset-0 z-[140] h-screen w-full overflow-hidden bg-[#06110d] touch-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_42%)]" />
            <div className="absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full bg-emerald-500/12 blur-3xl md:h-80 md:w-80" />
            <div className="absolute bottom-[-14%] right-[-8%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl md:h-96 md:w-96" />

            <div className="flex h-full items-center justify-center px-4 sm:px-6 md:px-10">
              <div className="flex min-h-[140px] w-full max-w-[94vw] items-center justify-center sm:min-h-[180px] md:min-h-[220px]">
                <AnimatePresence mode="wait">
                  {displayWord ? (
                    <motion.h1
                      key={displayWord}
                      initial={{
                        opacity: 0,
                        scale: 0.96,
                        letterSpacing: "0.03em",
                        filter: "blur(4px)",
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        letterSpacing: "0.08em",
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        scale: 1.04,
                        letterSpacing: "0.12em",
                        filter: "blur(3px)",
                      }}
                      transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="w-full bg-gradient-to-r from-emerald-300 via-white to-cyan-200 bg-clip-text text-center text-[clamp(3rem,14vw,10rem)] font-semibold leading-none text-transparent"
                    >
                      {displayWord}
                    </motion.h1>
                  ) : (
                    <div className="min-h-[72px] w-full sm:min-h-[96px] md:min-h-[120px]" />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <FooterPublic />
        </div>

        <div className="relative z-10 bg-[#eef8f2]">
          <NavbarPublic />
          <HomeContent mode="public" />
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>
    </div>
  );
}