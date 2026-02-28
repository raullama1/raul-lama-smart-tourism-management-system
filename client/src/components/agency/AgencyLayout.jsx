// client/src/components/agency/AgencyLayout.jsx
import AgencySidebar from "./AgencySidebar";

export default function AgencyLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#e6f4ec] flex">
      
      {/* Sidebar */}
      <aside className="h-screen sticky top-0 shrink-0">
        <AgencySidebar />
      </aside>

      {/* Content */}
      <section className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-6xl">
          {children}
        </div>
      </section>

    </main>
  );
}