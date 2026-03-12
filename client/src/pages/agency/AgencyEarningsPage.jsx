// client/src/pages/agency/AgencyEarningsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiDollarSign,
  FiSearch,
} from "react-icons/fi";
import AgencyLayout from "../../components/agency/AgencyLayout";
import { useAgencyAuth } from "../../context/AgencyAuthContext";
import { useAgencyNotifications } from "../../context/AgencyNotificationContext";
import { fetchAgencyEarnings } from "../../api/agencyEarningsApi";

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
        <FiCheckCircle size={12} />
      </span>
      Paid
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(16,185,129,0.16)]">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/40 blur-2xl transition duration-300 group-hover:scale-125" />
      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-teal-200/30 blur-2xl transition duration-300 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </h3>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/70 transition duration-300 group-hover:rotate-6 group-hover:scale-110">
          <FiDollarSign size={22} />
        </div>
      </div>
    </div>
  );
}

function MobileEarningCard({ item }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl transition duration-300 group-hover:scale-125" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Payment ID
            </p>
            <p className="mt-1 break-all text-sm font-bold text-slate-900">
              {item.payment_id}
            </p>
          </div>
          <StatusBadge />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tourist
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {item.tourist_name}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Amount
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              {item.formattedAmount}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Tour Name
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {item.tour_name}
          </p>
        </div>
      </div>
    </div>
  );
}

function AgencyEarningsPageContent({ openNotifications }) {
  const { token } = useAgencyAuth();
  const { unreadCount, refresh } = useAgencyNotifications();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
    }, 250);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;

    async function loadEarnings() {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetchAgencyEarnings(
          {
            search: query,
            sort,
            page: 1,
            limit: 30,
          },
          token
        );

        setRows(res.transactions || []);
        setSummary(
          res.summary || {
            totalAmount: 0,
            totalTransactions: 0,
          }
        );
      } catch (err) {
        console.error("Failed to load agency earnings", err);
        setPageError(
          err?.response?.data?.message || "Failed to load earnings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEarnings();
  }, [token, query, sort]);

  const formattedRows = useMemo(() => {
    return rows.map((item) => ({
      ...item,
      formattedAmount: formatCurrency(item.amount),
    }));
  }, [rows]);

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {}

    openNotifications?.();
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-[0_20px_80px_rgba(15,23,42,0.10)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.10),transparent_24%)]" />
      <div className="absolute -left-24 top-20 h-52 w-52 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-60 w-60 rounded-full bg-teal-200/30 blur-3xl" />

      <div className="relative border-b border-emerald-100/80 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.85)]" />
              Tourism Nepal
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Earnings & Payment History
            </h1>
          </div>

          <button
            type="button"
            onClick={handleOpenNotifications}
            className="relative inline-flex h-12 w-12 items-center justify-center self-start rounded-2xl border border-white/70 bg-white/80 text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Notifications"
            title="Notifications"
          >
            <FiBell size={19} />
            {Number(unreadCount || 0) > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-[24px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="relative px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <StatCard
            label="Total Paid"
            value={formatCurrency(summary.totalAmount)}
          />
          <StatCard
            label="Transactions"
            value={Number(summary.totalTransactions || 0).toLocaleString(
              "en-US"
            )}
          />
          <StatCard
            label="Average Per Payment"
            value={formatCurrency(
              summary.totalTransactions
                ? Number(summary.totalAmount || 0) /
                    Number(summary.totalTransactions || 1)
                : 0
            )}
          />
        </div>

        <div className="mt-6 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
              <div className="relative flex-1">
                <FiSearch
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by payment ID, tourist, tour..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="relative w-full sm:w-[210px]">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
                <FiChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <span className="text-slate-500">Showing</span>
              <span className="rounded-full bg-white px-3 py-1 text-emerald-700 shadow-sm">
                {formattedRows.length} record{formattedRows.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {pageError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {pageError}
            </div>
          ) : null}

          <div className="mt-5 hidden overflow-hidden rounded-[28px] border border-slate-200/80 bg-white lg:block">
            <div className="grid grid-cols-[1.2fr_1fr_1.4fr_0.9fr_0.8fr] gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50 px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              <div>Payment ID</div>
              <div>Tourist Name</div>
              <div>Tour Name</div>
              <div>Amount</div>
              <div>Status</div>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                Loading earnings...
              </div>
            ) : formattedRows.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                No paid payment history found.
              </div>
            ) : (
              formattedRows.map((item, index) => (
                <div
                  key={item.payment_id}
                  className={`grid grid-cols-[1.2fr_1fr_1.4fr_0.9fr_0.8fr] items-center gap-4 px-6 py-5 transition duration-300 hover:bg-emerald-50/40 ${
                    index !== formattedRows.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {item.payment_id}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {item.tourist_name}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {item.tour_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-emerald-700">
                      {item.formattedAmount}
                    </p>
                  </div>

                  <div>
                    <StatusBadge />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-4 lg:hidden">
            {loading ? (
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500">
                Loading earnings...
              </div>
            ) : formattedRows.length === 0 ? (
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500">
                No paid payment history found.
              </div>
            ) : (
              formattedRows.map((item) => (
                <MobileEarningCard key={item.payment_id} item={item} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgencyEarningsPage() {
  return (
    <AgencyLayout>
      {({ openNotifications }) => (
        <AgencyEarningsPageContent openNotifications={openNotifications} />
      )}
    </AgencyLayout>
  );
}