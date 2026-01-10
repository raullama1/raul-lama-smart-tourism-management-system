import { NavLink } from "react-router-dom";

export default function FooterTourist() {
  const quickLinks = [
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
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.25fr_0.9fr_0.85fr] gap-10 md:gap-14 items-start">
          {/* Left */}
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Tourism Nepal
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm">
              Explore authentic tours across Nepal with trusted agencies
            </p>
            <p className="mt-4 text-xs text-gray-500">
              © 2025 Tourism Nepal. All rights reserved.
            </p>
          </div>

          {/* Middle */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Quick Links</h4>
            <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
              {quickLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `transition-all ${
                      isActive
                        ? "text-emerald-700 font-semibold underline underline-offset-4"
                        : "text-gray-600 hover:text-emerald-700 hover:underline hover:underline-offset-4"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p>Kathmandu, Nepal</p>
              <p>+977-1-5551234</p>
              <p>info@tourismnp.com</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
