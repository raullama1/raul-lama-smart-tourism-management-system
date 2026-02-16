// client/src/components/agency/AgencyAuthLayout.jsx
import AgencySidebar from "./AgencySidebar";

export default function AgencyAuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#e6f4ec] flex">
      <aside className="sticky top-0 h-screen">
        <AgencySidebar />
      </aside>

      {/* Equal left/right space next to sidebar */}
      <section className="flex-1 px-6 py-10 flex justify-center">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </section>
    </main>
  );
}
