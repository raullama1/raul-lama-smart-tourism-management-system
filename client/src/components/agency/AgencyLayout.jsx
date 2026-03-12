// client/src/components/agency/AgencyLayout.jsx
import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import AgencySidebar from "./AgencySidebar";
import AgencyNotificationsDrawer from "./AgencyNotificationsDrawer";

export default function AgencyLayout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openNotifications = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const content =
    typeof children === "function"
      ? children({ openNotifications })
      : children ?? <Outlet context={{ openNotifications }} />;

  return (
    <>
      <main className="flex min-h-screen bg-[#e6f4ec]">
        <aside className="sticky top-0 h-screen shrink-0">
          <AgencySidebar />
        </aside>

        <section className="flex-1 px-6 py-6">
          <div className="mx-auto w-full max-w-6xl">{content}</div>
        </section>
      </main>

      <AgencyNotificationsDrawer open={drawerOpen} onClose={closeNotifications} />
    </>
  );
}