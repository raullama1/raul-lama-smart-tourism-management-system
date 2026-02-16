import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiMap,
  FiSettings,
  FiMessageSquare,
  FiBookOpen,
  FiStar,
  FiDollarSign,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiLogIn,
  FiUserPlus,
  FiHelpCircle,
} from "react-icons/fi";
import { useAgencyAuth } from "../../context/AgencyAuthContext";

function Item({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
          isActive
            ? "bg-emerald-700/70 text-white"
            : "text-emerald-50/90 hover:bg-emerald-800/40",
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

function Section({ icon: Icon, label, open, onToggle, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50/90 hover:bg-emerald-800/40"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-900/30">
            <Icon size={18} />
          </span>
          <span>{label}</span>
        </span>
        {open ? <FiChevronDown /> : <FiChevronRight />}
      </button>

      {open ? <div className="mt-1 ml-12 space-y-1">{children}</div> : null}
    </div>
  );
}

function SubItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          isActive
            ? "bg-emerald-700/60 text-white"
            : "text-emerald-50/80 hover:bg-emerald-800/35",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function AgencySidebar() {
  const { isAuthenticated, logout } = useAgencyAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const inTour = useMemo(
    () => location.pathname.startsWith("/agency/tours"),
    [location.pathname]
  );
  const inBookings = useMemo(
    () => location.pathname.startsWith("/agency/bookings"),
    [location.pathname]
  );

  const [tourOpen, setTourOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setTourOpen(false);
      setBookingsOpen(false);
      return;
    }
    if (inTour) setTourOpen(true);
    if (inBookings) setBookingsOpen(true);
  }, [isAuthenticated, inTour, inBookings]);

  const handleLogout = () => {
    logout();
    navigate("/agency/login");
  };

  return (
    <aside className="h-screen w-[260px] bg-gradient-to-b from-emerald-950 to-emerald-900 text-white flex flex-col overflow-hidden">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-50/10 border border-emerald-50/10 grid place-items-center">
            <span className="text-lg font-black">🏢</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold">Agency Portal</div>
            <div className="text-[11px] text-emerald-100/70">
              Manage tours & bookings
            </div>
          </div>
        </div>
      </div>

      {/* SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!isAuthenticated ? (
          <nav className="mt-2 space-y-2">
            <Item to="/agency/login" icon={FiLogIn} label="Login" />
            <Item to="/agency/register" icon={FiUserPlus} label="Register" />
            <Item to="/agency/help" icon={FiHelpCircle} label="Help" />
          </nav>
        ) : (
          <nav className="mt-2 space-y-2">
            <Item to="/agency/dashboard" icon={FiGrid} label="Dashboard" end />

            <Section
              icon={FiMap}
              label="Tour"
              open={tourOpen}
              onToggle={() => setTourOpen((p) => !p)}
            >
              <SubItem to="/agency/tours/new" label="Add Tour" />
              <SubItem to="/agency/tours/manage" label="Manage Tour" />
            </Section>

            <Section
              icon={FiSettings}
              label="Bookings"
              open={bookingsOpen}
              onToggle={() => setBookingsOpen((p) => !p)}
            >
              <SubItem to="/agency/bookings" label="View Bookings" />
              <SubItem to="/agency/bookings/details" label="Booking Details" />
            </Section>

            <Item to="/agency/chat" icon={FiMessageSquare} label="Chat" />
            <Item to="/agency/blogs" icon={FiBookOpen} label="Blogs" />
            <Item to="/agency/reviews" icon={FiStar} label="Reviews" />
            <Item to="/agency/earnings" icon={FiDollarSign} label="Earnings" />
            <Item to="/agency/profile" icon={FiUser} label="Profile" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50/90 hover:bg-emerald-800/40"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-900/30">
                <FiLogOut size={18} />
              </span>
              <span>Logout</span>
            </button>
          </nav>
        )}
      </div>

      <div className="px-4 py-4 border-t border-emerald-50/10">
        <p className="text-xs text-emerald-100/70 px-2">
          Smart Tourism Nepal — Manage your agency
        </p>
      </div>
    </aside>
  );
}
