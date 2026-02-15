import { NavLink } from "react-router-dom";
import { FiLogIn, FiUserPlus, FiHelpCircle } from "react-icons/fi";

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
          isActive ? "bg-emerald-700/70 text-white" : "text-emerald-50/90 hover:bg-emerald-800/40",
        ].join(" ")
      }
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-900/30">
        <Icon size={18} />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AgencySidebar() {
  return (
    <aside className="h-screen w-[260px] bg-gradient-to-b from-emerald-950 to-emerald-900 text-white px-4 py-5 flex flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="h-10 w-10 rounded-xl bg-emerald-50/10 border border-emerald-50/10 grid place-items-center">
          <span className="text-lg font-black">🏢</span>
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold">Agency Portal</div>
          <div className="text-[11px] text-emerald-100/70">Manage tours & bookings</div>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        <Item to="/agency/login" icon={FiLogIn} label="Login" />
        <Item to="/agency/register" icon={FiUserPlus} label="Register" />
        <Item to="/agency/help" icon={FiHelpCircle} label="Help" />
      </nav>

      <div className="mt-auto pt-6 border-t border-emerald-50/10">
        <p className="text-xs text-emerald-100/70 px-2">
          Welcome back • Access your dashboard
        </p>
      </div>
    </aside>
  );
}
