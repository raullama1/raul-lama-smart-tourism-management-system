// client/src/components/public/FooterPublic.jsx
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../assets/logo.png";

export default function FooterPublic() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/login", label: "Login" },
    { to: "/tours", label: "Tours" },
    { to: "/signup", label: "Signup" },
    { to: "/blogs", label: "Blogs" },
  ];

  return (
    <footer className="bg-white">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-7xl px-4 pt-10 pb-3 md:px-6 md:pt-10 md:pb-3"
      >
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-[1.25fr_0.95fr_0.85fr] md:gap-12 md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Tourism Nepal"
                className="h-11 w-11 rounded-2xl object-cover"
              />
              <h3 className="text-xl font-bold tracking-tight text-slate-950">
                Tourism Nepal
              </h3>
            </div>

            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
              Discover authentic destinations, trusted agencies and premium
              travel experiences across Nepal.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
              Quick Links
            </h4>

            <div className="mt-5 grid w-full max-w-xs grid-cols-2 gap-x-8 gap-y-3 text-sm text-center md:max-w-none md:text-left">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `transition-all duration-300 ${
                      isActive
                        ? "font-semibold text-emerald-700 underline underline-offset-4"
                        : "text-slate-600 hover:text-emerald-700"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
              Contact
            </h4>

            <div className="mt-5 space-y-2 text-sm leading-6 text-slate-600">
              <p>Kathmandu, Nepal</p>
              <p>info@tourismnp.com</p>
            </div>
          </div>
        </div>

        <div className="mt-7 text-center text-xs text-emerald-700 md:mt-8">
          © 2026 Tourism Nepal. All rights reserved.
        </div>
      </motion.div>
    </footer>
  );
}