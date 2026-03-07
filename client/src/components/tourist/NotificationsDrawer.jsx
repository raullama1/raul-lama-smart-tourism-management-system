import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTouristNotifications } from "../../context/TouristNotificationContext";

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
  const { items, loading, unreadCount, markRead, markAllRead, removeNotification } =
    useTouristNotifications();

  const list = useMemo(() => items || [], [items]);

  const handleOpen = async (notification) => {
    if (!notification) return;

    try {
      if (Number(notification.is_read || 0) !== 1 && !notification.read_at) {
        await markRead(notification.id);
      }
    } catch {
      // Ignore read update failure.
    }

    onClose();

    if (notification.action_path) {
      navigate(notification.action_path);
    }
  };

  const handleDelete = async (notification) => {
    if (!notification) return;

    try {
      if (Number(notification.is_read || 0) !== 1 && !notification.read_at) {
        await markRead(notification.id);
      }
    } catch {
      // Ignore read update failure.
    }

    await removeNotification(notification.id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180]">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[430px] bg-[#f7fbf8] shadow-2xl border-l border-emerald-100 flex flex-col">
        <div className="px-5 py-4 border-b border-emerald-100 bg-white flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Notifications</div>
            <div className="text-xs text-emerald-700 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
            >
              Mark all as read
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-gray-500">No notifications yet.</div>
          ) : (
            <div className="space-y-3">
              {list.map((n) => {
                const isRead = !!n.read_at || Number(n.is_read || 0) === 1;

                return (
                  <div
                    key={n.id}
                    className={`rounded-2xl border overflow-hidden ${
                      isRead
                        ? "border-gray-200 bg-white"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className="w-full text-left p-4 hover:bg-black/[0.02]"
                    >
                      <div className="flex items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              {timeAgo(n.created_at)}
                            </div>
                          </div>

                          <div className="mt-1 text-sm text-gray-700 break-words">
                            {n.message}
                          </div>

                          {n.action_path && (
                            <div className="mt-3 text-xs font-semibold text-emerald-700">
                              {n.action_label || "Open"}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="px-4 pb-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(n)}
                        className="rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}