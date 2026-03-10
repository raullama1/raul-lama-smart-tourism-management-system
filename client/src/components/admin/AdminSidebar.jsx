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
    <aside className="flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-[#082f20] via-[#0b3b29] to-[#06261a] text-white lg:w-[310px]">
      <div className="relative border-b border-white/10 px-5 pb-5 pt-6">
        <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
            <FiMap size={22} />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Tourism Nepal
            </p>
            <h2 className="mt-1 text-[20px] font-bold text-white">Admin Portal</h2>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold transition duration-300 ${
                  isActive
                    ? "bg-white text-[#0b3b29] shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "bg-[#0b3b29]/10 text-[#0b3b29]"
                      : "bg-white/5 text-white/85 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-white/85 transition duration-300 hover:bg-white/10 hover:text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
              <FiLogOut size={18} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}