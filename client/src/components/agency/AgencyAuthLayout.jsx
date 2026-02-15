import AgencySidebar from "./AgencySidebar";

export default function AgencyAuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#e6f4ec] flex">
      <AgencySidebar />

      <section className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl">{children}</div>
      </section>
    </main>
  );
}
