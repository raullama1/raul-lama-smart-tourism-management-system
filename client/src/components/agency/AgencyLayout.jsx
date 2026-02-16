// client/src/components/agency/AgencyLayout.jsx
import AgencySidebar from "./AgencySidebar";

export default function AgencyLayout({ children }) {
  return (
    <main className="h-screen bg-[#e6f4ec] flex overflow-hidden">
      <aside className="h-screen shrink-0">
        <AgencySidebar />
      </aside>

      <section className="flex-1 overflow-y-auto px-6 py-6 flex justify-center">
        <div className="w-full max-w-6xl my-2">{children}</div>
      </section>
    </main>
  );
}
