// client/src/components/tourist/NotificationsDrawer.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

export default function NotificationsDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { items, loading, unreadCount, markRead, markAllRead } = useNotifications();

  const list = useMemo(() => items || [], [items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180]">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl border-l border-gray-100 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">Notifications</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="rounded-xl border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Mark all as read
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-5 pt-4">
          {unreadCount > 0 ? (
            <div className="text-xs text-emerald-700 font-semibold">
              {unreadCount} unread
            </div>
          ) : (
            <div className="text-xs text-gray-500">No unread notifications</div>
          )}
        </div>

        <div className="flex-1 px-5 py-4 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-gray-500">No notifications yet.</div>
          ) : (
            <div className="space-y-3">
              {list.map((n) => {
                const isRead =
                  !!n.read_at || Number(n.is_read || 0) === 1;

                return (
                  <div
                    key={n.id}
                    className={`rounded-2xl border p-4 ${
                      isRead
                        ? "border-gray-100 bg-white"
                        : "border-emerald-100 bg-emerald-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white border border-gray-100" />

                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {n.title}
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          {n.message}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {timeAgo(n.created_at)}
                          </div>

                          <div className="flex items-center gap-2">
                            {n.action_path && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isRead) markRead(n.id);
                                  onClose();
                                  navigate(n.action_path);
                                }}
                                className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                {n.action_label || "View Details"}
                              </button>
                            )}

                            {!isRead && (
                              <button
                                type="button"
                                onClick={() => markRead(n.id)}
                                className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/notifications");
            }}
            className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-sm font-semibold"
          >
            View All Notifications
          </button>
        </div>
      </aside>
    </div>
  );
}
