// client/src/pages/admin/AdminPaymentsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEye, FiRefreshCw } from "react-icons/fi";
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
  return d.toISOString().slice(0, 10);
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  let className = "bg-gray-100 text-gray-700";

  if (normalized === "paid") {
    className = "bg-emerald-600 text-white";
  } else if (normalized === "pending") {
    className = "bg-amber-500 text-black";
  } else if (normalized === "failed") {
    className = "bg-red-600 text-white";
  }

  return (
    <span
      className={`inline-flex rounded-xl px-3 py-1 text-[14px] font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  const tableRows = useMemo(() => payments, [payments]);

  return (
    <main className="h-screen overflow-hidden bg-[#f5f8f5]">
      <div className="flex h-full flex-col lg:flex-row">
        <AdminSidebar active="payments" />

        <section className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-4">
          <div className="pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-[30px] leading-tight font-bold text-[#183128]">
                  Monitor Payments
                </h1>
                <p className="mt-1 text-[16px] font-semibold text-[#73917f]">
                  Track all transactions across tourists and agencies
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadPayments(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#06733f] px-5 py-3 text-[16px] font-semibold text-white hover:bg-[#056437] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#d7e3da] bg-white px-3 py-3 shadow-sm">
              {loading ? (
                <div className="rounded-xl border border-dashed border-[#d7e3da] px-4 py-10 text-center text-gray-500">
                  Loading payments...
                </div>
              ) : tableRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d7e3da] px-4 py-10 text-center text-gray-500">
                  No payment records found.
                </div>
              ) : (
                <table className="min-w-full border-collapse overflow-hidden rounded-2xl">
                  <thead>
                    <tr className="bg-[#e7f1eb]">
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Payment ID
                      </th>
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Tourist Name
                      </th>
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Agency Name
                      </th>
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Amount
                      </th>
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Date
                      </th>
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Status
                      </th>
                      <th className="px-4 py-4 text-left text-[15px] font-bold text-[#183128]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tableRows.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#dfe8e2] last:border-b-0"
                      >
                        <td className="px-4 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {item.payment_id}
                        </td>
                        <td className="px-4 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {item.tourist_name}
                        </td>
                        <td className="px-4 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {item.agency_name}
                        </td>
                        <td className="px-4 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-4 text-[16px] font-semibold text-[#1b1f1d]">
                          {formatDateOnly(item.date)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/payments/${item.id}`)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#06733f] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#056437]"
                          >
                            <FiEye size={17} />
                            View Payment Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}