import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiX,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiShield,
  FiMail,
  FiCalendar,
  FiPhone,
  FiBriefcase,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  getAdminAgencies,
  updateAdminAgencyStatus,
} from "../../api/adminAgenciesApi";

function StatusBadge({ blocked }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm ${
        blocked
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          blocked ? "bg-red-500" : "bg-emerald-500"
        }`}
      />
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function ModalShell({ open, title, onClose, children, maxWidth = "max-w-lg" }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`w-full ${maxWidth} overflow-hidden rounded-[28px] border border-white/50 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.22)]`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="px-6 py-6">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ConfirmModal({ agency, onClose, onConfirm, submitting }) {
  if (!agency) return null;

  const actionLabel = agency.is_blocked ? "Unblock" : "Block";
  const actionText = agency.is_blocked
    ? "This agency will be able to use the system again."
    : "This agency will be marked as blocked.";

  return (
    <ModalShell
      open={!!agency}
      title={`${actionLabel} Agency`}
      onClose={onClose}
    >
      <p className="text-[15px] leading-7 text-slate-600">
        Are you sure you want to{" "}
        <span className="font-semibold text-slate-900">
          {actionLabel.toLowerCase()}
        </span>{" "}
        <span className="font-semibold text-slate-900">
          {agency.name || agency.email}
        </span>
        ?
      </p>

      <p className="mt-3 text-sm text-slate-500">{actionText}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
            agency.is_blocked
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
              : "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
          }`}
        >
          {submitting ? "Updating..." : actionLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-CA");
}

function StatCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_45%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full xl:flex-[1.38]">
      <FiSearch
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}

function FilterSelect({ value, onChange, children, width = "md:w-[190px]" }) {
  return (
    <div className={`relative w-full xl:flex-none ${width}`}>
      <FiSliders
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 pl-12 pr-4 text-[15px] font-medium text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      >
        {children}
      </select>
    </div>
  );
}

function AgencyRowCard({ agency, onOpenStatus, onView }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900">
              {agency.name || "-"}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <FiMail size={15} />
              <span className="truncate">{agency.email}</span>
            </div>
          </div>
          <StatusBadge blocked={agency.is_blocked} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <FiPhone size={14} />
              Phone
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {agency.phone || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <FiCalendar size={14} />
              Joined Date
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatDateOnly(agency.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onOpenStatus(agency)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            {agency.is_blocked ? "Unblock" : "Block"}
          </button>

          <button
            type="button"
            onClick={() => onView(agency.id)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600"
          >
            <FiEye size={16} />
            View in Detail
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminAgenciesPage() {
  const navigate = useNavigate();

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    sort: "newest",
  });

  const [statusAgency, setStatusAgency] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadAgencies = useCallback(
    async (showRefresh = false, nextFilters = filters) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getAdminAgencies({
          q: nextFilters.q,
          status: nextFilters.status,
          sort: nextFilters.sort,
        });

        setAgencies(Array.isArray(data?.agencies) ? data.agencies : []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load agencies.";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      loadAgencies(false, filters);
    }, 250);

    return () => clearTimeout(id);
  }, [filters, loadAgencies]);

  const handleStatusUpdate = async () => {
    if (!statusAgency) return;

    try {
      setStatusSubmitting(true);
      await updateAdminAgencyStatus(statusAgency.id, !statusAgency.is_blocked);
      setStatusAgency(null);
      await loadAgencies(true, filters);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to update agency status.";
      setError(msg);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { label: "Status: All", value: "all" },
      { label: "Status: Active", value: "active" },
      { label: "Status: Blocked", value: "blocked" },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { label: "Sort: Newest First", value: "newest" },
      { label: "Sort: Oldest First", value: "oldest" },
    ],
    []
  );

  const activeCount = useMemo(
    () => agencies.filter((item) => !item.is_blocked).length,
    [agencies]
  );

  const blockedCount = useMemo(
    () => agencies.filter((item) => item.is_blocked).length,
    [agencies]
  );

  const withPhoneCount = useMemo(
    () => agencies.filter((item) => String(item.phone || "").trim()).length,
    [agencies]
  );

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f2f7f4_46%,#edf7f0_100%)]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="agencies" />

        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 xl:px-7">
          <div className="mx-auto max-w-[1700px] pb-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(14,165,233,0.08),transparent_24%)]" />

              <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Tourism Nepal
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Manage Agencies
                  </h1>
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => loadAgencies(true, filters)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRefreshCw
                    size={18}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </motion.button>
              </div>

              <div
                className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
                style={{ perspective: "1200px" }}
              >
                <StatCard
                  icon={<FiBriefcase size={22} />}
                  label="Visible Results"
                  value={agencies.length}
                  tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                />
                <StatCard
                  icon={<FiUserCheck size={22} />}
                  label="Active Accounts"
                  value={activeCount}
                  tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                />
                <StatCard
                  icon={<FiUserX size={22} />}
                  label="Blocked Accounts"
                  value={blockedCount}
                  tint="border-rose-100 bg-gradient-to-br from-rose-50 to-white"
                />
              </div>

              <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <FilterInput
                    value={filters.q}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, q: e.target.value }))
                    }
                    placeholder="Search name, email or phone"
                  />

                  <FilterSelect
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    width="md:w-[190px]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sort: e.target.value }))
                    }
                    width="md:w-[205px]"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FilterSelect>
                </div>
              </div>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </motion.div>
              ) : null}

              <div className="relative mt-6 overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                {loading ? (
                  <div className="px-4 py-16">
                    <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
                      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                      <p className="text-sm font-semibold text-slate-500">
                        Loading agencies...
                      </p>
                    </div>
                  </div>
                ) : agencies.length === 0 ? (
                  <div className="px-4 py-16">
                    <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        No agencies found.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="min-w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                          <tr className="border-b border-slate-200">
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Agency
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Email
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Phone
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Joined Date
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Status
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {agencies.map((agency, index) => (
                            <motion.tr
                              key={agency.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, delay: index * 0.03 }}
                              className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                    <FiBriefcase size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                      {agency.name || "-"}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                      ID #{agency.id}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                {agency.email}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                {agency.phone || "-"}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                {formatDateOnly(agency.created_at)}
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge blocked={agency.is_blocked} />
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => setStatusAgency(agency)}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                                  >
                                    {agency.is_blocked ? "Unblock" : "Block"}
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() =>
                                      navigate(`/admin/agencies/${agency.id}`)
                                    }
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600"
                                  >
                                    <FiEye size={16} />
                                    View in Detail
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-4 p-4 lg:hidden">
                      {agencies.map((agency) => (
                        <AgencyRowCard
                          key={agency.id}
                          agency={agency}
                          onOpenStatus={setStatusAgency}
                          onView={(id) => navigate(`/admin/agencies/${id}`)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <ConfirmModal
        agency={statusAgency}
        onClose={() => setStatusAgency(null)}
        onConfirm={handleStatusUpdate}
        submitting={statusSubmitting}
      />
    </main>
  );
}