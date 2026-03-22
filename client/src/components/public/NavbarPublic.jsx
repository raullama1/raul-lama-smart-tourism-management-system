// client/src/components/public/NavbarPublic.jsx
import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

export default function NavbarPublic() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const loginRef = useRef(null);
  const signupRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const buttons = [loginRef.current, signupRef.current];
    const cleanups = [];

    buttons.forEach((btn) => {
      if (!btn) return;

      const overlay = document.createElement("span");
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.background = "linear-gradient(90deg, #047857, #10b981)";
      overlay.style.borderRadius = "9999px";
      overlay.style.transform = "scaleX(0)";
      overlay.style.transformOrigin = "left center";
      overlay.style.zIndex = "-1";
      overlay.style.pointerEvents = "none";

      btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.style.isolation = "isolate";
      btn.appendChild(overlay);

      gsap.set(btn, {
        color: "#065f46",
        backgroundColor: "rgba(255,255,255,0.9)",
      });

      const enter = () => {
        gsap.to(overlay, { scaleX: 1, duration: 0.35, ease: "power2.out" });
        gsap.to(btn, { color: "#ffffff", y: -1.5, duration: 0.28 });
      };

      const leave = () => {
        gsap.to(overlay, { scaleX: 0, duration: 0.35, ease: "power2.out" });
        gsap.to(btn, { color: "#065f46", y: 0, duration: 0.28 });
      };

      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);

      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
        if (overlay.parentNode === btn) {
          btn.removeChild(overlay);
        }
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const lenis = window.__lenis;

    if (menuOpen) {
      document.body.style.overflow = "hidden";
      lenis?.stop?.();
    } else {
      document.body.style.overflow = "";
      lenis?.start?.();
    }

    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = "";
      lenis?.start?.();
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/tours", label: "Tours" },
    { to: "/blogs", label: "Blogs" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6">
            <div className="min-w-0 lg:flex lg:items-center lg:justify-start">
              <Link to="/" className="flex min-w-0 items-center gap-3">
                <img
                  src={logo}
                  alt="Tourism Nepal logo"
                  className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-[0_14px_30px_rgba(5,150,105,0.24)] md:h-12 md:w-12"
                />

                <span className="truncate font-bold tracking-tight text-slate-950 md:text-lg">
                  Tourism Nepal
                </span>
              </Link>
            </div>

            <nav className="hidden items-center justify-center gap-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.14)]"
                        : "text-slate-600 hover:bg-white hover:text-emerald-600"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center justify-end gap-3 lg:flex lg:min-w-0">
              {!isAuthenticated ? (
                <>
                  <button
                    ref={loginRef}
                    onClick={() => navigate("/login")}
                    className="relative shrink-0 rounded-full border border-emerald-200 px-5 py-2.5 text-sm font-semibold shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
                    type="button"
                  >
                    Login
                  </button>

                  <button
                    ref={signupRef}
                    onClick={() => navigate("/signup")}
                    className="relative shrink-0 rounded-full border border-emerald-200 px-5 py-2.5 text-sm font-semibold shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
                    type="button"
                  >
                    Signup
                  </button>
                </>
              ) : (
                <>
                  <span className="truncate text-sm text-slate-700">
                    Hi, <span className="font-semibold">{user?.name || "User"}</span>
                  </span>

                  <button
                    onClick={handleLogout}
                    className="shrink-0 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold"
                    type="button"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-0.5 lg:hidden"
              type="button"
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-950/45 lg:hidden"
              aria-label="Close menu overlay"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 z-[70] h-screen w-[86%] max-w-sm border-l border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="Tourism Nepal logo"
                    className="h-10 w-10 rounded-2xl object-cover"
                  />
                  <div className="font-bold text-slate-950">Tourism Nepal</div>
                </div>

                <button
                  onClick={() => setMenuOpen(false)}
                  type="button"
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                >
                  <FiX size={22} />
                </button>
              </div>

              <div className="space-y-2 p-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-[50px] items-center rounded-2xl px-4 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)]"
                          : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}

                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/login");
                      }}
                      className="w-full rounded-2xl bg-emerald-700 py-3 text-white"
                      type="button"
                    >
                      Login
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/signup");
                      }}
                      className="w-full rounded-2xl border border-slate-200 py-3 text-slate-700"
                      type="button"
                    >
                      Signup
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-700">
                      Hi, <span className="font-semibold">{user?.name || "User"}</span>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full rounded-2xl bg-emerald-700 py-3 text-white"
                      type="button"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}