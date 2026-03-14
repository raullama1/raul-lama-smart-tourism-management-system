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
      <main className="flex min-h-screen overflow-x-hidden bg-[#e6f4ec] lg:h-screen lg:overflow-hidden">
        <AgencySidebar />

        <section className="flex min-w-0 flex-1 px-3 pb-3 pt-20 sm:px-4 sm:pb-4 sm:pt-20 lg:h-screen lg:overflow-y-auto lg:px-6 lg:py-5">
          <div className="mx-auto flex w-full max-w-6xl min-w-0">
            <div className="w-full min-w-0">{content}</div>
          </div>
        </section>
      </main>

      <AgencyNotificationsDrawer open={drawerOpen} onClose={closeNotifications} />
    </>
  );
}