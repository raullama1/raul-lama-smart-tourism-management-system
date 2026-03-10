// client/src/components/admin/AdminLayout.jsx
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ active = "dashboard", children }) {
  return (
    <main className="min-h-screen bg-[#f3f7f3] text-[#183128]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="h-screen shrink-0 lg:sticky lg:top-0">
          <AdminSidebar active={active} />
        </aside>

        <section className="min-w-0 flex-1 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </section>
      </div>
    </main>
  );
}