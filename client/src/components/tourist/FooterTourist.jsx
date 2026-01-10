// client/src/components/tourist/FooterTourist.jsx
import { NavLink } from "react-router-dom";

export default function FooterTourist() {
  const links = [
    { to: "/home", label: "Home" },
    { to: "/tours", label: "Tours" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/bookings", label: "Bookings" },
    { to: "/blogs", label: "Blogs" },
    { to: "/chat", label: "Chat" },
    { to: "/notifications", label: "Notifications" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <footer className="border-t border-gray-200 bg-white py-4 mt-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 text-sm text-gray-600">
        <div className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `hover:text-[#004a2b] ${
                  isActive ? "border-b border-gray-900 pb-0.5" : ""
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="text-xs md:text-sm text-gray-500 flex items-center">
          © 2025 Tourism Nepal
        </div>
      </div>
    </footer>
  );
}
