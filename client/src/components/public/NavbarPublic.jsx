// client/src/components/public/NavbarPublic.jsx
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useAuth } from "../../context/AuthContext";

export default function NavbarPublic() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const loginRef = useRef(null);
  const signupRef = useRef(null);

  // GSAP hover animation (from OLD Navbar)
  useEffect(() => {
    const buttons = [loginRef.current, signupRef.current];

    buttons.forEach((btn) => {
      if (!btn) return;

      const overlay = document.createElement("span");
      overlay.style.position = "absolute";
      overlay.style.inset = "0";
      overlay.style.backgroundColor = "#00613f";
      overlay.style.borderRadius = "0.5rem";
      overlay.style.transform = "scaleX(0)";
      overlay.style.transformOrigin = "left center";
      overlay.style.zIndex = "-1";

      btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.appendChild(overlay);

      gsap.set(btn, { color: "#00613f", backgroundColor: "#fff" });

      btn.addEventListener("mouseenter", () => {
        gsap.to(overlay, { scaleX: 1, duration: 0.35, ease: "power2.out" });
        gsap.to(btn, { color: "#fff", scale: 1.05, duration: 0.3 });
      });

      btn.addEventListener("mouseleave", () => {
        gsap.to(overlay, { scaleX: 0, duration: 0.35, ease: "power2.out" });
        gsap.to(btn, { color: "#00613f", scale: 1, duration: 0.3 });
      });
    });
  }, []);

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "T";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/tours", label: "Tours" },
    { to: "/blogs", label: "Blogs" },
  ];

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-700 text-lg font-bold">{initial}</span>
          </div>
          <span className="font-semibold text-gray-900 text-base md:text-lg">
            Tourism Nepal
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 md:gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm md:text-base px-3 py-1 md:px-4 transition-colors ${
                  isActive
                    ? "text-emerald-700 border-b-2 border-emerald-700 font-semibold"
                    : "text-gray-600 hover:text-emerald-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Right Buttons */}
          {!isAuthenticated ? (
            <>
              <button
                ref={loginRef}
                onClick={() => navigate("/login")}
                className="relative text-sm md:text-base px-4 py-2 rounded-lg border border-emerald-600 font-medium bg-white overflow-hidden"
              >
                Login
              </button>

              <button
                ref={signupRef}
                onClick={() => navigate("/signup")}
                className="relative text-sm md:text-base px-4 py-2 rounded-lg border border-emerald-600 font-medium bg-white overflow-hidden"
              >
                Signup
              </button>
            </>
          ) : (
            <>
              <span className="hidden md:inline text-sm text-gray-700 mr-1">
                Hi, <span className="font-semibold">{user.name}</span>
              </span>

              <button
                onClick={handleLogout}
                className="text-xs md:text-sm px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
