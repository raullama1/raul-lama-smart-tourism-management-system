// client/src/components/admin/AdminLayout.jsx
import { motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ active = "dashboard", children }) {
  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#f2f7f4_48%,#edf7f0_100%)] text-[#183128]">
      <div className="flex h-full flex-col lg:flex-row">
        <aside className="shrink-0 lg:h-screen lg:overflow-hidden">
          <AdminSidebar active={active} />
        </aside>

        <section className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:h-screen lg:px-6 lg:py-6 xl:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative mx-auto w-full max-w-[1680px]"
          >
            {children}
          </motion.div>
        </section>
      </div>
    </main>
  );
}