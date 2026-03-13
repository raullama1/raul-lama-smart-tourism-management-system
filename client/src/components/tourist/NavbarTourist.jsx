// client/src/components/tourist/NavbarTourist.jsx
import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useRef, useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { FiBell, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTouristNotifications } from "../../context/TouristNotificationContext";
import NotificationsDrawer from "./NotificationsDrawer";
import { fetchMyProfile, buildAvatarUrl } from "../../api/profileApi";
import logo from "../../assets/logo.png";

export default function NavbarTourist() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const logoutRef = useRef(null);
  const { unreadCount, refresh } = useTouristNotifications();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const effectiveUser = profileUser || user || null;

  const avatarUrl = useMemo(() => {
    if (avatarFailed) return "";
    return buildAvatarUrl(effectiveUser?.profile_image);
  }, [effectiveUser?.profile_image, avatarFailed]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [effectiveUser?.profile_image]);

  useEffect(() => {
    let active = true;

    const loadProfileForNavbar = async () => {
      if (!token) return;

      try {
        const res = await fetchMyProfile(token);
        const u = res?.data?.user || null;
        if (active) {
          setProfileUser(u);
        }
      } catch (error) {
        console.error("Failed to load navbar profile:", error);
      }
    };

    loadProfileForNavbar();

    return () => {
      active = false;
    };
  }, [token, location.pathname]);

  useEffect(() => {
    const btn = logoutRef.current;
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

    return () => {
      btn.removeEventListener("mouseenter", enter);
      btn.removeEventListener("mouseleave", leave);
      if (overlay.parentNode === btn) {
        btn.removeChild(overlay);
      }
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
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      setDrawerOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { to: "/home", label: "Home" },
    { to: "/tours", label: "Tours" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/bookings", label: "Bookings" },
    { to: "/blogs", label: "Blogs" },
    { to: "/chat", label: "Chat" },
    { to: "/profile", label: "Profile" },
  ];

  const openDrawer = async () => {
    setDrawerOpen(true);

    try {
      await refresh?.();
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8">
            <div className="min-w-0 lg:flex lg:items-center lg:justify-start">
              <Link to="/home" className="flex min-w-0 items-center gap-3">
                <img
                  src={logo}
                  alt="Tourism Nepal logo"
                  className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-[0_14px_30px_rgba(5,150,105,0.24)] md:h-12 md:w-12"
                />

                <div className="min-w-0">
                  <div className="truncate text-base font-bold tracking-tight text-slate-950 md:text-lg">
                    Tourism Nepal
                  </div>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center justify-center gap-1 lg:ml-10 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
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

            <div className="flex items-center justify-end gap-2 md:gap-3 lg:min-w-0">
              <button
                type="button"
                onClick={openDrawer}
                className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.07)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:text-emerald-600"
                aria-label="Notifications"
                title="Notifications"
              >
                <FiBell size={18} />
                {Number(unreadCount || 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <button
                ref={logoutRef}
                onClick={handleLogout}
                className="relative hidden min-h-[44px] shrink-0 rounded-full border border-emerald-200 px-5 py-2.5 text-sm font-semibold shadow-[0_12px_28px_rgba(15,23,42,0.07)] lg:inline-flex"
                type="button"
              >
                Logout
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.07)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 lg:hidden"
                aria-label="Open menu"
              >
                <FiMenu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
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
              className="fixed right-0 top-0 z-[70] flex h-screen w-[86%] max-w-sm flex-col border-l border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="Tourism Nepal logo"
                    className="h-10 w-10 rounded-2xl object-cover"
                  />
                  <div className="text-base font-bold text-slate-950">Tourism Nepal</div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  aria-label="Close menu"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-emerald-100 shadow-[0_14px_30px_rgba(5,150,105,0.22)]">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${effectiveUser?.name || "Tourist"} profile`}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span className="text-base font-bold text-emerald-900">
                        {(effectiveUser?.name || "T")[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {effectiveUser?.name || "Tourist"}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {effectiveUser?.email || ""}
                    </div>
                  </div>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * index, duration: 0.3 }}
                    >
                      <NavLink
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex min-h-[50px] items-center rounded-2xl px-4 text-sm font-medium transition-all ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)]"
                              : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </motion.div>
                  ))}
                </nav>
              </div>

              <div className="border-t border-slate-200 p-4">
                <button
                  onClick={handleLogout}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)]"
                  type="button"
                >
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <NotificationsDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  );
}