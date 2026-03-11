// client/src/components/tourist/NotificationsDrawer.jsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCheckCircle,
  FiChevronRight,
  FiTrash2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTouristNotifications } from "../../context/TouristNotificationContext";

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);

  if (sec < 60) return "Just now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function NotificationsDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const {
    items,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
  } = useTouristNotifications();

  const list = useMemo(() => items || [], [items]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleOpen = async (notification) => {
    if (!notification) return;

    try {
      if (Number(notification.is_read || 0) !== 1 && !notification.read_at) {
        await markRead(notification.id);
      }
    } catch {}

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
    } catch {}

    await removeNotification(notification.id);
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[180]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: "100%", opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,251,247,0.98)_100%)] shadow-[0_20px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl"
          >
            <div className="relative overflow-hidden border-b border-emerald-100/80 bg-white/80 px-4 py-4 sm:px-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_left,rgba(59,130,246,0.08),transparent_24%)]" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-200/60">
                      <FiBell size={20} />
                    </div>
                    <div>
                      <div className="text-lg font-bold tracking-tight text-slate-900">
                        Notifications
                      </div>
                      <div className="mt-1 text-xs font-semibold text-emerald-700">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-600 transition hover:bg-slate-50"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiCheck size={15} />
                  Mark all as read
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {loading ? (
                <div className="flex h-full min-h-[240px] items-center justify-center">
                  <div className="rounded-[28px] border border-slate-200 bg-white/80 px-8 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                    <div className="text-sm font-semibold text-slate-500">
                      Loading notifications...
                    </div>
                  </div>
                </div>
              ) : list.length === 0 ? (
                <div className="flex h-full min-h-[340px] items-center justify-center">
                  <div className="w-full max-w-sm rounded-[30px] border border-dashed border-emerald-200 bg-white/75 px-6 py-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-600">
                      <FiCheckCircle size={28} />
                    </div>
                    <div className="mt-4 text-lg font-bold text-slate-900">
                      No notifications yet
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">
                      New alerts, updates, and actions will appear here.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {list.map((n, index) => {
                    const isRead = !!n.read_at || Number(n.is_read || 0) === 1;

                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 20, y: 8 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.22, delay: index * 0.03 }}
                        className={`group relative overflow-hidden rounded-[26px] border shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${
                          isRead
                            ? "border-slate-200 bg-white/90"
                            : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70"
                        }`}
                      >
                        {!isRead ? (
                          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-500 to-emerald-300" />
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleOpen(n)}
                          className="w-full text-left p-4 pr-4 transition hover:bg-black/[0.02] sm:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                isRead
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              <FiBell size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                                      {n.title}
                                    </h3>
                                    {!isRead ? (
                                      <span className="inline-flex shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                        New
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="shrink-0 text-[11px] font-semibold text-slate-400 sm:text-xs">
                                  {timeAgo(n.created_at)}
                                </div>
                              </div>

                              <div className="mt-2 break-words text-sm leading-6 text-slate-600">
                                {n.message}
                              </div>

                              {n.action_path ? (
                                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                  {n.action_label || "Open"}
                                  <FiChevronRight size={14} />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
                          <div className="text-xs font-medium text-slate-400">
                            {isRead ? "Read" : "Unread"}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(n)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <FiTrash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}