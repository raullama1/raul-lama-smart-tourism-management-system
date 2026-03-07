// client/src/components/agency/AgencyLayout.jsx
import { useState } from "react";
import AgencySidebar from "./AgencySidebar";
import AgencyNotificationsDrawer from "./AgencyNotificationsDrawer";

export default function AgencyLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-[#e6f4ec] flex">
        <aside className="h-screen sticky top-0 shrink-0">
          <AgencySidebar />
        </aside>

        <section className="flex-1 px-6 py-6">
          <div className="w-full max-w-6xl mx-auto">
            {typeof children === "function"
              ? children({
                  openNotifications: () => setDrawerOpen(true),
                })
              : children}
          </div>
        </section>
      </main>

      <AgencyNotificationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}