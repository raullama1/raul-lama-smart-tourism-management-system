// client/src/pages/admin/AdminPaymentDetailsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiCreditCard,
  FiUser,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiHash,
  FiShield,
  FiMail,
  FiUsers,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getAdminPaymentById } from "../../api/adminPaymentsApi";

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

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const tone = getStatusTone(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${tone}`}
    >
      {normalized === "paid" ? <FiCheckCircle size={16} /> : null}
      {status || "-"}
    </span>
  );
}

function SummaryCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${tint}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_45%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900 xl:text-3xl">
            {value || "-"}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function InfoBlock({ icon, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="rounded-[22px] border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-[0_10px_30px_rgba(16,24,40,0.06)]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 break-words text-[15px] font-semibold text-slate-900 md:text-base">
            {value || "-"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-3 last:border-b-0 md:grid-cols-[200px_1fr]">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="break-words text-[15px] font-semibold text-slate-900 md:text-base">
        {value || "-"}
      </p>
    </div>
  );
}

export default function AdminPaymentDetailsPage() {
  const navigate = useNavigate();
  const { paymentId } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const loadPayment = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      const data = await getAdminPaymentById(paymentId);
      setPayment(data?.payment || null);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to load payment details.";
      setPageError(msg);
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  const invoice = useMemo(() => {
    const total = Number(payment?.amount || 0);
    return {
      subtotal: total,
      serviceFee: 0,
      vat: 0,
      totalPaid: total,
    };
  }, [payment]);

  const isPaid = String(payment?.status || "").toLowerCase() === "paid";

  const handleDownloadInvoice = () => {
    if (!payment || !isPaid) return;

    try {
      setDownloading(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(6, 115, 63);
      doc.rect(0, 0, pageWidth, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Tourism Nepal", 14, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Payment Receipt", 14, 22);

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Payment Receipt", 14, 44);

      doc.setDrawColor(220, 230, 224);
      doc.line(14, 48, pageWidth - 14, 48);

      let y = 58;

      const rows = [
        ["Receipt No.", payment.payment_id || "-"],
        ["Booking Reference", payment.booking_ref || "-"],
        ["Payment Status", payment.status || "-"],
        ["Payment Method", payment.payment_method || "eSewa"],
        ["Payment Date", formatDateTime(payment.paid_at || payment.date)],
        ["Tour Name", payment.tour_title || "-"],
        ["Agency Name", payment.agency_name || "-"],
        ["Tourist Name", payment.tourist_name || "-"],
        ["Tourist Email", payment.tourist_email || "-"],
        ["Transaction ID", payment.transaction_id || "-"],
        ["eSewa Ref ID", payment.esewa_ref_id || "-"],
        ["eSewa Transaction Code", payment.esewa_transaction_code || "-"],
        ["Selected Date", payment.selected_date_label || "-"],
        ["Travelers", String(payment.travelers || 0)],
      ];

      rows.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(`${label}`, 14, y);

        doc.setFont("helvetica", "normal");
        doc.text(String(value), 78, y, { maxWidth: 115 });

        y += 8;
      });

      y += 4;
      doc.setDrawColor(220, 230, 224);
      doc.line(14, y, pageWidth - 14, y);
      y += 10;

      const amountRows = [
        ["Subtotal", formatCurrency(invoice.subtotal)],
        ["Service Fee", formatCurrency(invoice.serviceFee)],
        ["VAT", formatCurrency(invoice.vat)],
      ];

      amountRows.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, pageWidth - 14, y, { align: "right" });
        y += 8;
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Total Paid", 14, y + 4);
      doc.text(formatCurrency(invoice.totalPaid), pageWidth - 14, y + 4, {
        align: "right",
      });

      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "This receipt is generated by Tourism Nepal using stored eSewa transaction details.",
        14,
        y
      );
      doc.text(
        "It is not the original downloadable receipt file issued directly by eSewa.",
        14,
        y + 6
      );

      doc.save(`${payment.payment_id || "payment-receipt"}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

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
                    Payment Details
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                    Full transaction breakdown for accounting, audit, and receipt download.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isPaid ? (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleDownloadInvoice}
                      disabled={downloading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiDownload size={18} />
                      {downloading ? "Downloading..." : "Download Receipt (PDF)"}
                    </motion.button>
                  ) : null}

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate("/admin/payments")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
                  >
                    <FiArrowLeft size={18} />
                    Back to Payments
                  </motion.button>
                </div>
              </div>

              {pageError ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {pageError}
                </motion.div>
              ) : null}

              {loading ? (
                <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                  <p className="text-sm font-semibold text-slate-500">
                    Loading payment details...
                  </p>
                </div>
              ) : !payment ? (
                <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">
                    Payment not found.
                  </p>
                </div>
              ) : (
                <div className="relative mt-6 space-y-5">
                  <div
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                    style={{ perspective: "1200px" }}
                  >
                    <SummaryCard
                      icon={<FiCreditCard size={20} />}
                      label="Payment ID"
                      value={payment.payment_id}
                      tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                    />
                    <SummaryCard
                      icon={<FiUser size={20} />}
                      label="Tourist"
                      value={payment.tourist_name}
                      tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                    />
                    <SummaryCard
                      icon={<FiMapPin size={20} />}
                      label="Agency"
                      value={payment.agency_name}
                      tint="border-violet-100 bg-gradient-to-br from-violet-50 to-white"
                    />
                    <SummaryCard
                      icon={<FiFileText size={20} />}
                      label="Amount"
                      value={formatCurrency(payment.amount)}
                      tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2.05fr_1fr]">
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 }}
                      className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Payment Summary
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Core transaction details saved in the system.
                          </p>
                        </div>
                        <StatusBadge status={payment.status} />
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoBlock
                          icon={<FiHash size={20} />}
                          label="Booking Reference"
                          value={payment.booking_ref}
                        />
                        <InfoBlock
                          icon={<FiCreditCard size={20} />}
                          label="Payment Method"
                          value={payment.payment_method || "eSewa"}
                        />
                        <InfoBlock
                          icon={<FiUser size={20} />}
                          label="Paid By"
                          value={payment.tourist_name}
                        />
                        <InfoBlock
                          icon={<FiMail size={20} />}
                          label="Tourist Email"
                          value={payment.tourist_email}
                        />
                      </div>

                      <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-4 shadow-inner md:p-5">
                        <DetailRow label="Payment ID" value={payment.payment_id} />
                        <DetailRow label="Tour Name" value={payment.tour_title} />
                        <DetailRow label="Agency Name" value={payment.agency_name} />
                        <DetailRow label="Paid By (Tourist)" value={payment.tourist_name} />
                        <DetailRow label="Tourist Email" value={payment.tourist_email} />
                        <DetailRow label="Booking Reference" value={payment.booking_ref} />
                        <DetailRow label="Transaction ID" value={payment.transaction_id} />
                        <DetailRow label="eSewa Ref ID" value={payment.esewa_ref_id} />
                        <DetailRow
                          label="eSewa Transaction Code"
                          value={payment.esewa_transaction_code}
                        />
                        <DetailRow
                          label="Payment Method"
                          value={payment.payment_method || "eSewa"}
                        />
                        <DetailRow
                          label="Booking Date"
                          value={formatDateOnly(payment.booking_date)}
                        />
                        <DetailRow
                          label="Payment Date"
                          value={formatDateTime(payment.paid_at || payment.date)}
                        />
                        <DetailRow
                          label="Selected Date"
                          value={payment.selected_date_label}
                        />
                        <DetailRow
                          label="Travelers"
                          value={String(payment.travelers || 0)}
                        />
                        <DetailRow
                          label="Amount"
                          value={formatCurrency(payment.amount)}
                        />
                        <div className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[200px_1fr]">
                          <p className="text-sm font-semibold text-slate-500">Status</p>
                          <div>
                            <StatusBadge status={payment.status} />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="space-y-5"
                    >
                      <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                          Receipt Summary
                        </h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Final paid amount and receipt overview.
                        </p>

                        <div className="mt-5 rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-4">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                            <span className="text-sm font-semibold text-slate-500">
                              Subtotal
                            </span>
                            <span className="text-base font-semibold text-slate-900">
                              {formatCurrency(invoice.subtotal)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 py-3">
                            <span className="text-sm font-semibold text-slate-500">
                              Service Fee
                            </span>
                            <span className="text-base font-semibold text-slate-900">
                              {formatCurrency(invoice.serviceFee)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                            <span className="text-sm font-semibold text-slate-500">
                              VAT
                            </span>
                            <span className="text-base font-semibold text-slate-900">
                              {formatCurrency(invoice.vat)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-4">
                            <span className="text-base font-bold text-slate-700">
                              Total Paid
                            </span>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">
                              {formatCurrency(invoice.totalPaid)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          <InfoBlock
                            icon={<FiCalendar size={20} />}
                            label="Paid Date"
                            value={formatDateOnly(payment.paid_at || payment.date)}
                          />
                          <InfoBlock
                            icon={<FiShield size={20} />}
                            label="Payment Status"
                            value={payment.status}
                          />
                          <InfoBlock
                            icon={<FiUsers size={20} />}
                            label="Travelers"
                            value={String(payment.travelers || 0)}
                          />
                        </div>

                        <p className="mt-5 text-sm leading-6 text-slate-500">
                          This receipt uses the saved eSewa transaction details from your system.
                        </p>

                        {isPaid ? (
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleDownloadInvoice}
                            disabled={downloading}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FiDownload size={18} />
                            {downloading ? "Downloading..." : "Download Receipt (PDF)"}
                          </motion.button>
                        ) : null}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}