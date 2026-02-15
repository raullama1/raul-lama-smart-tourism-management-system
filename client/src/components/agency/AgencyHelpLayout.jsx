// client/src/components/agency/AgencyHelpLayout.jsx
import AgencySidebar from "./AgencySidebar";

export default function AgencyHelpLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#e6f4ec] flex">
      <aside className="sticky top-0 h-screen">
        <AgencySidebar />
      </aside>

      <section className="flex-1 h-screen overflow-y-auto px-6 py-10">
        <div className="w-full max-w-4xl mx-auto">
          {children}
        </div>
      </section>
    </main>
  );
}
