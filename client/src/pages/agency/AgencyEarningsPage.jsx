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

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
      <FiCheckCircle size={14} />
      Paid
    </span>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="inline-flex h-[50px] items-center gap-2 whitespace-nowrap rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800">
      <FiDollarSign size={16} />
      <span>{label}:</span>
      <span>
        Rs{" "}
        {Number(value || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
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
      formattedAmount: `Rs ${Number(item.amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    }));
  }, [rows]);

  const TABLE_GRID =
    "grid grid-cols-[170px_1.1fr_1.3fr_170px_130px] gap-4";

  const handleOpenNotifications = async () => {
    try {
      await refresh?.();
    } catch {
      // ignore
    }

    openNotifications?.();
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm">
      <div className="flex items-start justify-between border-b border-emerald-100 px-6 py-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Earnings / Payment History
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenNotifications}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-700 transition hover:bg-emerald-50"
          aria-label="Notifications"
          title="Notifications"
        >
          <FiBell size={18} />
          {Number(unreadCount || 0) > 0 && (
            <span className="absolute -right-1 -top-1 grid h-6 min-w-[24px] place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="px-6 py-6">
        <div className="mb-5 overflow-x-auto">
          <div className="flex min-w-max items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-[320px] shrink-0">
                <FiSearch
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by payment ID, tourist, tour..."
                  className="h-[50px] w-full rounded-xl border border-emerald-100 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-[50px] appearance-none rounded-xl border border-emerald-100 bg-white px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
                <FiChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SummaryPill label="Total Paid" value={summary.totalAmount} />
            </div>
          </div>
        </div>

        {pageError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
          <div className="border-b border-white/40 bg-white/45 px-4 py-4 text-sm font-bold text-emerald-900/85 backdrop-blur-md supports-[backdrop-filter]:bg-emerald-100/35">
            <div className={TABLE_GRID}>
              <div>Payment ID</div>
              <div>Tourist Name</div>
              <div>Tour Name</div>
              <div>Amount (Rs)</div>
              <div>Status</div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Loading earnings...
            </div>
          ) : formattedRows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No paid payment history found.
            </div>
          ) : (
            formattedRows.map((item, index) => (
              <div
                key={item.payment_id}
                className={[
                  "px-4 py-4",
                  index !== formattedRows.length - 1
                    ? "border-b border-emerald-100"
                    : "",
                ].join(" ")}
              >
                <div className={[TABLE_GRID, "items-center"].join(" ")}>
                  <div className="text-sm font-medium leading-6 text-slate-700">
                    {item.payment_id}
                  </div>

                  <div className="text-sm font-medium leading-6 text-slate-700">
                    {item.tourist_name}
                  </div>

                  <div className="text-sm font-medium leading-6 text-slate-700">
                    {item.tour_name}
                  </div>

                  <div className="text-sm font-medium leading-6 text-slate-700">
                    {item.formattedAmount}
                  </div>

                  <div>
                    <StatusBadge />
                  </div>
                </div>
              </div>
            ))
          )}
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