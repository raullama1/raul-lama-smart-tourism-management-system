import AgencySidebar from "./AgencySidebar";

export default function AgencyAuthLayout({ children }) {
  return (
    <main className="h-screen bg-[#e6f4ec] flex overflow-hidden">
      <aside className="h-screen shrink-0">
        <AgencySidebar />
      </aside>

      <section className="flex-1 overflow-y-auto px-6 py-8 flex justify-center">
        <div className="w-full max-w-3xl">{children}</div>
      </section>
    </main>
  );
}
