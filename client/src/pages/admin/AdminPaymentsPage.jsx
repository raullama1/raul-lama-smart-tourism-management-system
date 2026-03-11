// client/src/pages/admin/AdminPaymentsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiEye,
  FiRefreshCw,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiSearch,
  FiSliders,
  FiTrendingUp,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getAdminPayments } from "../../api/adminPaymentsApi";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-CA");
}

function matchesSearch(values, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(q));
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  let className =
    "border-slate-200 bg-slate-100 text-slate-700";
  let dotClass = "bg-slate-500";

  if (normalized === "paid") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
    dotClass = "bg-emerald-500";
  } else if (normalized === "pending") {
    className = "border-amber-200 bg-amber-50 text-amber-700";
    dotClass = "bg-amber-500";
  } else if (normalized === "failed") {
    className = "border-red-200 bg-red-50 text-red-700";
    dotClass = "bg-red-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_45%)]" />
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
    <div className="relative w-full xl:flex-[1.3]">
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

function FilterSelect({ value, onChange, children, width = "md:w-[185px]" }) {
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

function PaymentRowCard({ item, onView }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900">
              {item.payment_id}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {formatCurrency(item.amount)}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <FiUser size={14} />
              Tourist
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {item.tourist_name || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <FiUser size={14} />
              Agency
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {item.agency_name || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 sm:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <FiCalendar size={14} />
              Date
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatDateOnly(item.date)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onView(item.id)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600"
        >
          <FiEye size={16} />
          View Payment Detail
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminPaymentsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    sort: "newest",
  });

  const loadPayments = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getAdminPayments();
      setPayments(Array.isArray(data?.payments) ? data.payments : []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load payments.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "all" },
      { label: "Paid", value: "paid" },
      { label: "Pending", value: "pending" },
      { label: "Failed", value: "failed" },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { label: "Newest First", value: "newest" },
      { label: "Oldest First", value: "oldest" },
      { label: "Amount High", value: "amount_desc" },
      { label: "Amount Low", value: "amount_asc" },
    ],
    []
  );

  const filteredPayments = useMemo(() => {
    const list = payments.filter((item) => {
      const matchesQ = matchesSearch(
        [
          item.payment_id,
          item.tourist_name,
          item.agency_name,
          item.amount,
          item.date,
          item.status,
        ],
        filters.q
      );

      const matchesStatus =
        filters.status === "all"
          ? true
          : String(item.status || "").toLowerCase() === filters.status;

      return matchesQ && matchesStatus;
    });

    list.sort((a, b) => {
      if (filters.sort === "oldest") {
        return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0);
      }

      if (filters.sort === "amount_desc") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }

      if (filters.sort === "amount_asc") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }

      return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
    });

    return list;
  }, [payments, filters]);

  const totalRevenue = useMemo(
    () =>
      filteredPayments
        .filter((item) => String(item.status || "").toLowerCase() === "paid")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [filteredPayments]
  );

  const paidCount = useMemo(
    () =>
      filteredPayments.filter(
        (item) => String(item.status || "").toLowerCase() === "paid"
      ).length,
    [filteredPayments]
  );

  const pendingCount = useMemo(
    () =>
      filteredPayments.filter(
        (item) => String(item.status || "").toLowerCase() === "pending"
      ).length,
    [filteredPayments]
  );

  const failedCount = useMemo(
    () =>
      filteredPayments.filter(
        (item) => String(item.status || "").toLowerCase() === "failed"
      ).length,
    [filteredPayments]
  );

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f2f7f4_46%,#edf7f0_100%)]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="payments" />

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
                    Admin Panel
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Monitor Payments
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                    Track transactions, review payment status, and monitor revenue in one clean dashboard.
                  </p>
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => loadPayments(true)}
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
                className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                style={{ perspective: "1200px" }}
              >
                <StatCard
                  icon={<FiTrendingUp size={22} />}
                  label="Paid Revenue"
                  value={formatCurrency(totalRevenue)}
                  tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                />
                <StatCard
                  icon={<FiCheckCircle size={22} />}
                  label="Paid"
                  value={paidCount}
                  tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                />
                <StatCard
                  icon={<FiClock size={22} />}
                  label="Pending"
                  value={pendingCount}
                  tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                />
                <StatCard
                  icon={<FiXCircle size={22} />}
                  label="Failed"
                  value={failedCount}
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
                    placeholder="Search payment, tourist or agency"
                  />

                  <FilterSelect
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    width="md:w-[180px]"
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
                      setFilters((prev) => ({
                        ...prev,
                        sort: e.target.value,
                      }))
                    }
                    width="md:w-[190px]"
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
                        Loading payments...
                      </p>
                    </div>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="px-4 py-16">
                    <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        No payment records found.
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
                              Payment ID
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Tourist
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Agency
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Amount
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Date
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Status
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredPayments.map((item, index) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, delay: index * 0.03 }}
                              className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                    <FiCreditCard size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                      {item.payment_id}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                      Record #{item.id}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                {item.tourist_name || "-"}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                {item.agency_name || "-"}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                {formatDateOnly(item.date)}
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="px-5 py-4">
                                <motion.button
                                  whileHover={{ y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  type="button"
                                  onClick={() => navigate(`/admin/payments/${item.id}`)}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600"
                                >
                                  <FiEye size={16} />
                                  View Payment Detail
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-4 p-4 lg:hidden">
                      {filteredPayments.map((item) => (
                        <PaymentRowCard
                          key={item.id}
                          item={item}
                          onView={(id) => navigate(`/admin/payments/${id}`)}
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
    </main>
  );
}