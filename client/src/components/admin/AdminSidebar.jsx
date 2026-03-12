// client/src/components/admin/AdminSidebar.jsx
import { useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiBarChart2,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMap,
  FiStar,
  FiUsers,
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

  const handleSidebarScroll = (event) => {
    sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(event.currentTarget.scrollTop));
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SIDEBAR_SCROLL_KEY);
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="relative w-full shrink-0 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,#07281d_0%,#0a3526_45%,#041b13_100%)] text-white lg:h-screen lg:w-[300px] lg:border-b-0 lg:border-r lg:border-white/10">
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
            className="flex-1 overflow-x-auto overflow-y-hidden lg:overflow-y-auto lg:overflow-x-hidden"
          >
            <div className="flex gap-3 pb-2 lg:flex-col lg:gap-4 lg:pb-0">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink key={item.key} to={item.path} className="block shrink-0 lg:w-full">
                    {({ isActive }) => (
                      <div
                        className={`group relative flex min-h-[72px] min-w-[155px] items-center gap-3 rounded-[26px] border px-4 py-3 text-left text-[14px] font-semibold transition-colors duration-200 sm:min-w-[170px] lg:min-w-0 lg:w-full ${
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
                          <span className="absolute right-4 hidden h-2.5 w-2.5 rounded-full bg-emerald-500 lg:block" />
                        ) : null}
                      </div>
                    )}
                  </NavLink>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="group relative flex min-h-[72px] min-w-[155px] shrink-0 items-center gap-3 rounded-[26px] border border-white/5 bg-white/[0.04] px-4 py-3 text-left text-[14px] font-semibold text-white/85 transition-colors duration-200 hover:border-red-300/20 hover:bg-red-500/10 hover:text-white sm:min-w-[170px] lg:min-w-0 lg:w-full"
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
  );
}