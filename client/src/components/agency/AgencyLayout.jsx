// client/src/components/agency/AgencyLayout.jsx
import { useState } from "react";
import { FiBell } from "react-icons/fi";
import AgencySidebar from "./AgencySidebar";
import AgencyNotificationsDrawer from "./AgencyNotificationsDrawer";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";

export default function AgencyLayout({ children }) {
  const { unreadCount, refresh } = useAgencyNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = async () => {
    setDrawerOpen(true);

    try {
      await refresh?.();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#e6f4ec] flex">
        <aside className="h-screen sticky top-0 shrink-0">
          <AgencySidebar />
        </aside>

        <section className="flex-1 px-6 py-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={openDrawer}
                className="relative inline-flex items-center justify-center rounded-2xl border border-white/60 bg-white px-4 py-3 shadow-sm hover:shadow-md transition"
                aria-label="Notifications"
                title="Notifications"
              >
                <FiBell size={18} className="text-gray-700" />

                {Number(unreadCount || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {children}
          </div>
        </section>
      </main>

      <AgencyNotificationsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}