// client/src/components/admin/AdminSidebar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiBarChart2,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMap,
  FiStar,
  FiUsers,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAdminAuth } from "../../context/AdminAuthContext";

const SIDEBAR_SCROLL_KEY = "admin_sidebar_scroll_top";

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid, path: "/admin/dashboard" },
  { key: "tourists", label: "Tourists", icon: FiUsers, path: "/admin/tourists" },
  { key: "agencies", label: "Agencies", icon: FiMap, path: "/admin/agencies" },
  { key: "payments", label: "Payments", icon: FiCreditCard, path: "/admin/payments" },
  { key: "reviews", label: "Reviews", icon: FiStar, path: "/admin/reviews" },
  { key: "reports", label: "Reports", icon: FiBarChart2, path: "/admin/reports" },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAdminAuth();
  const scrollRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const savedScrollTop = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (savedScrollTop !== null) {
      node.scrollTop = Number(savedScrollTop) || 0;
    }
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const restoreScroll = () => {
      const savedScrollTop = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
      if (savedScrollTop !== null) {
        node.scrollTop = Number(savedScrollTop) || 0;
      }
    };

    restoreScroll();

    const frame = window.requestAnimationFrame(restoreScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSidebarScroll = (event) => {
    sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(event.currentTarget.scrollTop));
  };

  const toggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SIDEBAR_SCROLL_KEY);
    setMobileOpen(false);
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="fixed right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-900/10 bg-white text-emerald-900 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition duration-300 hover:scale-[1.02] lg:hidden"
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      <div
        onClick={closeMobileSidebar}
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-all duration-300 lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[290px] shrink-0 overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,#07281d_0%,#0a3526_45%,#041b13_100%)] text-white transition-transform duration-300 lg:static lg:z-auto lg:h-screen lg:w-[300px] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-14 top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -right-12 top-24 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col">
          <div className="border-b border-white/10 px-4 pb-4 pt-5 sm:px-5 sm:pb-5 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.14)] backdrop-blur-xl">
                <FiMap size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/60">
                  Tourism Nepal
                </p>
                <h2 className="mt-1 truncate text-[20px] font-bold tracking-tight text-white">
                  Admin Portal
                </h2>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5">
            <nav
              ref={scrollRef}
              onScroll={handleSidebarScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden"
            >
              <div className="flex flex-col gap-4 pb-0">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      className="block w-full"
                      onClick={closeMobileSidebar}
                    >
                      {({ isActive }) => (
                        <div
                          className={`group relative flex min-h-[72px] w-full items-center gap-3 rounded-[26px] border px-4 py-3 text-left text-[14px] font-semibold transition-colors duration-200 ${
                            isActive
                              ? "border-white/20 bg-white text-[#0a3526] shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
                              : "border-white/5 bg-white/[0.04] text-white/85 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                          }`}
                        >
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] transition-colors duration-200 ${
                              isActive
                                ? "bg-[#0a3526]/10 text-[#0a3526]"
                                : "bg-white/5 text-white/85 group-hover:bg-white/10 group-hover:text-white"
                            }`}
                          >
                            <Icon size={20} />
                          </span>

                          <span className="truncate text-[15px] font-semibold">{item.label}</span>

                          {isActive ? (
                            <span className="absolute right-4 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          ) : null}
                        </div>
                      )}
                    </NavLink>
                  );
                })}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="group relative flex min-h-[72px] w-full items-center gap-3 rounded-[26px] border border-white/5 bg-white/[0.04] px-4 py-3 text-left text-[14px] font-semibold text-white/85 transition-colors duration-200 hover:border-red-300/20 hover:bg-red-500/10 hover:text-white"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/5 text-white/85 transition-colors duration-200 group-hover:bg-red-500/15 group-hover:text-white">
                    <FiLogOut size={20} />
                  </span>
                  <span className="truncate text-[15px] font-semibold">Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}