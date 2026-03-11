// client/src/pages/admin/AdminAgencyDetailsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiSearch,
  FiSliders,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiMapPin,
  FiFileText,
  FiBookOpen,
  FiStar,
  FiDollarSign,
  FiMap,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  getAdminAgencyById,
  updateAdminAgencyStatus,
} from "../../api/adminAgenciesApi";

function StatusBadge({ blocked }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-xl ${
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

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClassName,
  onClose,
  onConfirm,
  submitting,
}) {
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
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/40 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.22)]"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-[15px] leading-7 text-slate-600">{message}</p>

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
                  className={confirmClassName}
                >
                  {submitting ? "Please wait..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-CA");
}

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function matchesSearch(values, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(q));
}

function StatCard({ icon, label, value, tint }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      className={`group relative overflow-hidden rounded-[26px] border p-5 shadow-[0_12px_35px_rgba(16,24,40,0.08)] ${tint}`}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-slate-700 shadow-sm ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="rounded-[24px] border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-[0_10px_30px_rgba(16,24,40,0.06)]"
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

function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full xl:flex-[1.32]">
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

export default function AdminAgencyDetailsPage() {
  const navigate = useNavigate();
  const { agencyId } = useParams();

  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [tourFilters, setTourFilters] = useState({
    q: "",
    sort: "newest",
    status: "all",
  });

  const [blogFilters, setBlogFilters] = useState({
    q: "",
    sort: "newest",
    type: "all",
  });

  const loadAgency = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const data = await getAdminAgencyById(agencyId);
      setAgency(data?.agency || null);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to load agency details.";
      setPageError(msg);
      setAgency(null);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadAgency();
  }, [loadAgency]);

  const handleToggleStatus = async () => {
    if (!agency) return;

    try {
      setStatusSubmitting(true);
      await updateAdminAgencyStatus(agency.id, !agency.is_blocked);
      setStatusModalOpen(false);
      await loadAgency();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to update agency status.";
      setPageError(msg);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const tours = Array.isArray(agency?.tours) ? agency.tours : [];
  const blogs = Array.isArray(agency?.blogs) ? agency.blogs : [];

  const tourStatusOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        tours.map((item) => String(item.listing_status || "").trim()).filter(Boolean)
      )
    );
    return ["all", ...unique];
  }, [tours]);

  const blogTypeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        blogs.map((item) => String(item.type || "").trim()).filter(Boolean)
      )
    );
    return ["all", ...unique];
  }, [blogs]);

  const filteredTours = useMemo(() => {
    const list = tours.filter((tour) => {
      const matchesQ = matchesSearch(
        [tour.tour_title, tour.location, tour.listing_status, tour.price],
        tourFilters.q
      );

      const matchesStatus =
        tourFilters.status === "all"
          ? true
          : String(tour.listing_status || "").toLowerCase() ===
            String(tourFilters.status || "").toLowerCase();

      return matchesQ && matchesStatus;
    });

    list.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime() || 0;
      const bTime = new Date(b.created_at).getTime() || 0;
      if (tourFilters.sort === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return list;
  }, [tours, tourFilters]);

  const filteredBlogs = useMemo(() => {
    const list = blogs.filter((blog) => {
      const matchesQ = matchesSearch(
        [blog.title, blog.type, blog.created_at],
        blogFilters.q
      );

      const matchesType =
        blogFilters.type === "all"
          ? true
          : String(blog.type || "").toLowerCase() ===
            String(blogFilters.type || "").toLowerCase();

      return matchesQ && matchesType;
    });

    list.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime() || 0;
      const bTime = new Date(b.created_at).getTime() || 0;
      if (blogFilters.sort === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return list;
  }, [blogs, blogFilters]);

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
              <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                    Admin Panel
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    Agency Profile
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                    View agency details, tours, blogs, and account status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/admin/agencies")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
                >
                  <FiArrowLeft size={18} />
                  Back to Manage Agencies
                </button>
              </div>

              {pageError ? (
                <div className="relative mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {pageError}
                </div>
              ) : null}

              {loading ? (
                <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                  <p className="text-sm font-semibold text-slate-500">
                    Loading agency details...
                  </p>
                </div>
              ) : !agency ? (
                <div className="relative mt-6 rounded-[28px] border border-white/70 bg-white/80 px-6 py-14 text-center shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">
                    Agency not found.
                  </p>
                </div>
              ) : (
                <div className="relative mt-6 space-y-5">
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
                    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Account Overview
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Main agency information and current status.
                          </p>
                        </div>
                        <StatusBadge blocked={agency.is_blocked} />
                      </div>

                      <div className="relative mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoCard icon={<FiMap size={20} />} label="Agency Name" value={agency.name} />
                        <InfoCard icon={<FiMail size={20} />} label="Email" value={agency.email} />
                        <InfoCard icon={<FiPhone size={20} />} label="Phone" value={agency.phone} />
                        <InfoCard icon={<FiMapPin size={20} />} label="Address" value={agency.address} />
                        <InfoCard icon={<FiFileText size={20} />} label="PAN / VAT" value={agency.pan_vat} />
                        <InfoCard icon={<FiCalendar size={20} />} label="Joined Date" value={formatDateOnly(agency.created_at)} />
                        <InfoCard icon={<FiShield size={20} />} label="Account Status" value={agency.is_blocked ? "Blocked" : "Active"} />
                      </div>

                      <div className="relative mt-5">
                        <button
                          type="button"
                          onClick={() => setStatusModalOpen(true)}
                          className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition ${
                            agency.is_blocked
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                              : "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
                          }`}
                        >
                          {agency.is_blocked ? "Unblock Agency" : "Block Agency"}
                        </button>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
                      <div className="relative">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                          Activity Summary
                        </h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Quick overview of agency contribution.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                          <StatCard
                            icon={<FiMap size={22} />}
                            label="Total Tours"
                            value={agency.total_tours || 0}
                            tint="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
                          />
                          <StatCard
                            icon={<FiBookOpen size={22} />}
                            label="Total Blogs"
                            value={agency.total_blogs || 0}
                            tint="border-sky-100 bg-gradient-to-br from-sky-50 to-white"
                          />
                          <StatCard
                            icon={<FiStar size={22} />}
                            label="Total Reviews"
                            value={agency.total_reviews || 0}
                            tint="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
                          />
                          <StatCard
                            icon={<FiDollarSign size={22} />}
                            label="Total Earnings"
                            value={formatCurrency(agency.total_earnings || 0)}
                            tint="border-violet-100 bg-gradient-to-br from-violet-50 to-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Tours
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Search and filter listed tours.
                          </p>
                        </div>
                        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          {filteredTours.length} Result{filteredTours.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
                        <FilterInput
                          value={tourFilters.q}
                          onChange={(e) =>
                            setTourFilters((prev) => ({
                              ...prev,
                              q: e.target.value,
                            }))
                          }
                          placeholder="Search tour, location or status"
                        />

                        <FilterSelect
                          value={tourFilters.sort}
                          onChange={(e) =>
                            setTourFilters((prev) => ({
                              ...prev,
                              sort: e.target.value,
                            }))
                          }
                          width="md:w-[185px]"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </FilterSelect>

                        <FilterSelect
                          value={tourFilters.status}
                          onChange={(e) =>
                            setTourFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          width="md:w-[190px]"
                        >
                          {tourStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status === "all" ? "All Status" : status}
                            </option>
                          ))}
                        </FilterSelect>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-inner">
                        {filteredTours.length === 0 ? (
                          <div className="m-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-medium text-slate-500">
                            No tours found.
                          </div>
                        ) : (
                          <div className="max-h-[520px] overflow-auto">
                            <table className="min-w-full border-collapse">
                              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                                <tr className="border-b border-slate-200">
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Tour
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Location
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Price
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Status
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Created
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredTours.map((tour) => (
                                  <tr
                                    key={tour.id}
                                    className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                                  >
                                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                      {tour.tour_title}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                      {tour.location}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                      {formatCurrency(tour.price)}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                      {tour.listing_status}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                      {formatDateOnly(tour.created_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            Blogs
                          </h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Search and filter published blogs.
                          </p>
                        </div>
                        <div className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                          {filteredBlogs.length} Result{filteredBlogs.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
                        <FilterInput
                          value={blogFilters.q}
                          onChange={(e) =>
                            setBlogFilters((prev) => ({
                              ...prev,
                              q: e.target.value,
                            }))
                          }
                          placeholder="Search title or type"
                        />

                        <FilterSelect
                          value={blogFilters.sort}
                          onChange={(e) =>
                            setBlogFilters((prev) => ({
                              ...prev,
                              sort: e.target.value,
                            }))
                          }
                          width="md:w-[185px]"
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </FilterSelect>

                        <FilterSelect
                          value={blogFilters.type}
                          onChange={(e) =>
                            setBlogFilters((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }))
                          }
                          width="md:w-[190px]"
                        >
                          {blogTypeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type === "all" ? "All Types" : type}
                            </option>
                          ))}
                        </FilterSelect>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-inner">
                        {filteredBlogs.length === 0 ? (
                          <div className="m-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-medium text-slate-500">
                            No blogs found.
                          </div>
                        ) : (
                          <div className="max-h-[520px] overflow-auto">
                            <table className="min-w-full border-collapse">
                              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                                <tr className="border-b border-slate-200">
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Title
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Type
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Created
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredBlogs.map((blog) => (
                                  <tr
                                    key={blog.id}
                                    className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                                  >
                                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                      {blog.title}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                      {blog.type}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                      {formatDateOnly(blog.created_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={statusModalOpen}
        title={agency?.is_blocked ? "Unblock Agency" : "Block Agency"}
        message={
          agency?.is_blocked
            ? "Are you sure you want to unblock this agency?"
            : "Are you sure you want to block this agency?"
        }
        confirmLabel={agency?.is_blocked ? "Unblock Agency" : "Block Agency"}
        confirmClassName={`rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
          agency?.is_blocked
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
            : "bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
        }`}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        submitting={statusSubmitting}
      />
    </main>
  );
}