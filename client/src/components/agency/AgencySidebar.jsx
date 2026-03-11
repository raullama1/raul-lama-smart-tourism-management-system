// client/src/components/agency/AgencySidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiMap,
  FiMessageSquare,
  FiBookOpen,
  FiStar,
  FiDollarSign,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiLogIn,
  FiUserPlus,
  FiHelpCircle,
  FiSettings,
  FiPlus,
  FiCheckSquare,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAgencyAuth } from "../../context/AgencyAuthContext";

function SidebarItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.985 }}
          className={`group relative mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
            isActive
              ? "border-white/18 bg-white text-emerald-950 shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
              : "border-transparent text-emerald-50/90 hover:border-white/8 hover:bg-white/10"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${
              isActive
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-white/10 bg-white/8 text-emerald-50 group-hover:bg-white/12"
            }`}
          >
            <Icon size={18} />
          </div>

          <span className="truncate">{label}</span>

          {isActive ? (
            <div className="absolute right-3 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.7)]" />
          ) : null}
        </motion.div>
      )}
    </NavLink>
  );
}

function SidebarSubItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <motion.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.985 }}
          className={`group mb-1.5 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
            isActive
              ? "border-white/12 bg-white/14 text-white shadow-[0_8px_18px_rgba(255,255,255,0.06)]"
              : "border-transparent text-emerald-50/75 hover:border-white/8 hover:bg-white/8 hover:text-emerald-50"
          }`}
        >
          {Icon ? (
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300 ${
                isActive ? "bg-white/16" : "bg-white/6 group-hover:bg-white/10"
              }`}
            >
              <Icon size={14} />
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </motion.div>
      )}
    </NavLink>
  );
}

function SidebarSection({ icon: Icon, label, open, onToggle, children }) {
  return (
    <div className="mb-2 space-y-2">
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.985 }}
        type="button"
        onClick={onToggle}
        className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
          open
            ? "border-white/10 bg-white/10 text-white"
            : "border-transparent text-emerald-50/90 hover:border-white/8 hover:bg-white/8"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${
              open
                ? "border-white/15 bg-white/14 text-white"
                : "border-white/10 bg-white/8 text-emerald-50"
            }`}
          >
            <Icon size={18} />
          </span>
          <span className="truncate">{label}</span>
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="ml-3 shrink-0 text-emerald-100/80"
        >
          <FiChevronDown size={18} />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-1 border-l border-white/10 pl-4">
              <div className="space-y-0.5">{children}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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

  const inBlog = useMemo(
    () => location.pathname.startsWith("/agency/blogs"),
    [location.pathname]
  );

  const [tourOpen, setTourOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setTourOpen(false);
      setBlogOpen(false);
      return;
    }

    if (inTour) setTourOpen(true);
    if (inBlog) setBlogOpen(true);
  }, [isAuthenticated, inTour, inBlog]);

  const handleLogout = () => {
    logout();
    navigate("/agency/login");
  };

  return (
    <aside className="relative h-screen w-[280px] shrink-0 overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_26%),linear-gradient(180deg,#022c22_0%,#064e3b_48%,#022c22_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute bottom-16 right-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_16%,transparent_84%,rgba(255,255,255,0.04))]" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="px-5 pb-4 pt-5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
            className="rounded-[28px] border border-white/10 bg-white/8 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_55%)]" />
                <span className="relative text-2xl">🏢</span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-white">
                  Agency Portal
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-100/70">
                  Manage tours, blogs & bookings
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative flex-1 overflow-y-auto px-5 pb-5">
          {!isAuthenticated ? (
            <motion.nav
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: 0.04 }}
            >
              <SidebarItem to="/agency/login" icon={FiLogIn} label="Login" />
              <SidebarItem to="/agency/register" icon={FiUserPlus} label="Register" />
              <SidebarItem to="/agency/help" icon={FiHelpCircle} label="Help" />
            </motion.nav>
          ) : (
            <motion.nav
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: 0.04 }}
            >
              <SidebarItem
                to="/agency/dashboard"
                icon={FiGrid}
                label="Dashboard"
                end
              />

              <SidebarSection
                icon={FiMap}
                label="Tour"
                open={tourOpen}
                onToggle={() => setTourOpen((prev) => !prev)}
              >
                <SidebarSubItem
                  to="/agency/tours/existing"
                  label="Add Existing Tour"
                  icon={FiPlus}
                />
                <SidebarSubItem
                  to="/agency/tours/new"
                  label="Add New Tour"
                  icon={FiPlus}
                />
                <SidebarSubItem
                  to="/agency/tours/manage"
                  label="Manage Tour"
                  icon={FiCheckSquare}
                />
              </SidebarSection>

              <SidebarItem
                to="/agency/bookings"
                icon={FiSettings}
                label="Bookings"
              />
              <SidebarItem
                to="/agency/chat"
                icon={FiMessageSquare}
                label="Chat"
              />

              <SidebarSection
                icon={FiBookOpen}
                label="Blogs"
                open={blogOpen}
                onToggle={() => setBlogOpen((prev) => !prev)}
              >
                <SidebarSubItem
                  to="/agency/blogs/add"
                  label="Add Blog"
                  icon={FiPlus}
                />
                <SidebarSubItem
                  to="/agency/blogs/manage"
                  label="Manage Blog"
                  icon={FiCheckSquare}
                />
              </SidebarSection>

              <SidebarItem to="/agency/reviews" icon={FiStar} label="Reviews" />
              <SidebarItem
                to="/agency/earnings"
                icon={FiDollarSign}
                label="Earnings"
              />
              <SidebarItem to="/agency/profile" icon={FiUser} label="Profile" />

              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleLogout}
                className="group mt-2 flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3.5 text-sm font-semibold text-emerald-50/90 transition-all duration-300 hover:border-red-400/10 hover:bg-red-500/12 hover:text-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 transition-all duration-300 group-hover:border-red-400/20 group-hover:bg-red-500/18">
                  <FiLogOut size={18} />
                </span>
                <span>Logout</span>
              </motion.button>
            </motion.nav>
          )}
        </div>

        <div className="relative border-t border-white/10 px-5 py-4">
          <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/55">
              Tourism Nepal
            </p>
            <p className="mt-1 text-xs text-emerald-100/75">
              Manage your agency with a cleaner workspace
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}