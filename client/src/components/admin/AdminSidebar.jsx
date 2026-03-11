// client/src/components/admin/AdminSidebar.jsx
import {
  FiBarChart2,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMap,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid, path: "/admin/dashboard" },
  { key: "tourists", label: "Tourists", icon: FiUsers, path: "/admin/tourists" },
  { key: "agencies", label: "Agencies", icon: FiMap, path: "/admin/agencies" },
  { key: "payments", label: "Payments", icon: FiCreditCard, path: "/admin/payments" },
  { key: "reviews", label: "Reviews", icon: FiStar, path: "/admin/reviews" },
  { key: "reports", label: "Reports", icon: FiBarChart2, path: "/admin/reports" },
];

export default function AdminSidebar({ active = "dashboard" }) {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
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
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5">
          <nav className="flex-1 overflow-x-auto overflow-y-hidden lg:overflow-y-auto lg:overflow-x-hidden">
            <div className="flex gap-3 pb-2 lg:block lg:space-y-2.5 lg:pb-0">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = item.key === active;

                return (
                  <motion.button
                    key={item.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.24, delay: index * 0.04 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`group relative flex min-w-[155px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[14px] font-semibold transition sm:min-w-[170px] lg:min-w-0 lg:w-full lg:px-4 ${
                      isActive
                        ? "border-white/20 bg-white text-[#0a3526] shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
                        : "border-transparent bg-white/[0.04] text-white/85 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isActive
                          ? "bg-[#0a3526]/10 text-[#0a3526]"
                          : "bg-white/5 text-white/85 group-hover:bg-white/10 group-hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="truncate">{item.label}</span>

                    {isActive ? (
                      <span className="absolute right-3 hidden h-2.5 w-2.5 rounded-full bg-emerald-500 lg:block" />
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </nav>

          <div className="mt-5 border-t border-white/10 pt-4">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/[0.04] px-4 py-3 text-left text-[14px] font-semibold text-white/85 transition hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/85 transition group-hover:bg-white/10 group-hover:text-white">
                <FiLogOut size={18} />
              </span>
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </aside>
  );
}