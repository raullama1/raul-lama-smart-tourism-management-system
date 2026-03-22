// client/src/components/tourist/FooterTourist.jsx
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../assets/logo.png";

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
    <footer className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-[#071510] text-white md:min-h-[calc(100vh-80px)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#081611_0%,#06130f_52%,#04100c_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_26%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.07),transparent_22%),radial-gradient(circle_at_bottom_center,rgba(16,185,129,0.06),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-68px)] w-full max-w-7xl flex-col justify-between px-3 pt-4 pb-3 xs:px-4 xs:pt-5 xs:pb-4 sm:px-5 sm:pt-6 sm:pb-5 md:min-h-[calc(100vh-80px)] md:px-6 md:pt-8 md:pb-6 lg:px-8 lg:pt-10">
        <div className="flex flex-1 items-center">
          <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.22fr)_auto] lg:gap-8 xl:grid-cols-[minmax(0,1.28fr)_auto] xl:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="flex min-w-0 flex-col justify-center text-center lg:pr-4 lg:text-left"
            >
              <div className="inline-flex max-w-full self-center items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-emerald-200/90 backdrop-blur-xl xs:gap-3 xs:px-4 xs:py-2 xs:text-xs sm:text-sm lg:self-start">
                <img
                  src={logo}
                  alt="Tourism Nepal"
                  className="h-8 w-8 rounded-lg object-cover xs:h-9 xs:w-9 xs:rounded-xl sm:h-10 sm:w-10"
                />
                <span className="truncate font-medium">Tourism Nepal</span>
              </div>

              <h2 className="mt-4 bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-[clamp(1.9rem,7vw,4.2rem)] font-semibold leading-[1.05] tracking-tight text-transparent">
                Continue exploring Nepal with smarter travel tools
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-6 text-white/70 xs:text-sm sm:mt-4 sm:text-[15px] sm:leading-7 lg:mx-0 lg:max-w-xl xl:max-w-2xl">
                Manage wishlist, bookings, blogs, chat and your travel profile
                in one seamless tourism experience.
              </p>

              <div className="mt-5 flex w-full flex-col items-stretch gap-2.5 xs:gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <NavLink
                  to="/tours"
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 sm:min-h-[48px] sm:w-auto sm:min-w-[150px] sm:px-6"
                >
                  Explore Tours
                </NavLink>

                <NavLink
                  to="/bookings"
                  className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10 sm:min-h-[48px] sm:w-auto sm:min-w-[150px] sm:px-6"
                >
                  My Bookings
                </NavLink>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.65, delay: 0.04 }}
              className="mx-auto flex w-full max-w-[380px] min-w-0 flex-col gap-4 sm:max-w-[400px] lg:mx-0 lg:w-auto lg:max-w-none lg:items-start"
            >
              <div className="relative w-full overflow-hidden rounded-[22px] border border-emerald-300/10 bg-white/[0.04] p-4 backdrop-blur-xl xs:p-5 sm:rounded-[24px] md:rounded-[26px] md:p-6 lg:w-[295px] xl:w-[310px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_42%)]" />

                <div className="relative">
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-100/90 xs:text-[11px] sm:text-xs">
                    Quick Links
                  </h4>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] xs:gap-x-5 sm:mt-5 sm:gap-x-6 sm:text-sm">
                    {quickLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                          `group inline-flex w-fit max-w-full transition-all duration-300 ${
                            isActive
                              ? "font-semibold text-emerald-300"
                              : "text-white/72 hover:text-emerald-300"
                          }`
                        }
                      >
                        <span className="relative break-words">
                          {link.label}
                          <span className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-300 transition-all duration-300 group-hover:w-full" />
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative w-full overflow-hidden rounded-[22px] border border-cyan-300/10 bg-white/[0.04] p-4 backdrop-blur-xl xs:p-5 sm:rounded-[24px] md:rounded-[26px] md:p-6 lg:w-[235px] xl:w-[250px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_44%)]" />

                <div className="relative">
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/90 xs:text-[11px] sm:text-xs">
                    Contact
                  </h4>

                  <div className="mt-4 space-y-2.5 text-[13px] leading-6 xs:text-sm sm:mt-5">
                    <p className="text-white/76">Kathmandu, Nepal</p>
                    <p className="break-all text-white/68 sm:break-words">
                      support@tourismnepal.com
                    </p>
                    <p className="text-emerald-200/85">+977 9800000000</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
          className="mt-4 flex items-center justify-center border-t border-white/10 pt-4 text-center text-[10px] text-emerald-200/80 xs:text-[11px] sm:mt-5 sm:pt-5 sm:text-xs"
        >
          <p>© 2026 Tourism Nepal. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
}