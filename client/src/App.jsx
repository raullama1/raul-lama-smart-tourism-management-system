// client/src/App.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "@studio-freight/lenis";
import AppRouter from "./router/AppRouter";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname || "";

    const disableSmoothScroll =
      pathname.startsWith("/agency") || pathname.startsWith("/admin");

    if (disableSmoothScroll) {
      if (window.__lenis) {
        window.__lenis.destroy();
        window.__lenis = undefined;
      }

      document.documentElement.classList.remove("lenis");
      document.body.classList.remove("lenis");
      document.documentElement.style.scrollBehavior = "";
      document.body.style.scrollBehavior = "";

      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
    });

    let frameId;

    const raf = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };

    frameId = requestAnimationFrame(raf);

    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, { offset: -20 });
    };

    document.addEventListener("click", handleAnchorClick);
    window.__lenis = lenis;

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      cancelAnimationFrame(frameId);
      lenis.destroy();
      if (window.__lenis === lenis) {
        window.__lenis = undefined;
      }
    };
  }, [location.pathname]);

  return <AppRouter />;
}