// client/src/components/admin/admin/AdminSidebar.jsx
import { FiBarChart2, FiCreditCard, FiGrid, FiLogOut, FiMap, FiStar, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid },
  { key: "tourists", label: "Tourists", icon: FiUsers },
  { key: "agencies", label: "Agencies", icon: FiMap },
  { key: "payments", label: "Payments", icon: FiCreditCard },
  { key: "reviews", label: "Reviews", icon: FiStar },
  { key: "reports", label: "Reports", icon: FiBarChart2 },
];

export default function AdminSidebar({ active = "dashboard" }) {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="w-full lg:w-[310px] bg-[#004225] text-white flex flex-col min-h-screen px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <FiMap size={22} />
        <h2 className="text-[18px] font-semibold">Admin Portal</h2>
      </div>

      <nav className="mt-8 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;

          return (
            <button
              key={item.key}
              type="button"
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[16px] font-semibold transition ${
                isActive
                  ? "bg-[#06733f] text-white"
                  : "text-white hover:bg-[#0a5c38]"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/70 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[16px] font-semibold text-white hover:bg-[#0a5c38] transition"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}