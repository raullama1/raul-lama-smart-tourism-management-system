// client/src/pages/tourist/BookingsPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavbarTourist from "../../components/tourist/NavbarTourist";
import FooterTourist from "../../components/tourist/FooterTourist";
import { useAuth } from "../../context/AuthContext";
import { fetchMyBookings, payBooking, cancelBooking } from "../../api/bookingApi";
import {
  FaCreditCard,
  FaPen,
  FaTimes,
  FaExclamationTriangle,
  FaTimesCircle,
  FaRedo,
  FaInfoCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toPublicImageUrl, FALLBACK_TOUR_IMG } from "../../utils/publicImageUrl";

const PAGE_SIZE = 5;

const pageIntro = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

const modalBackdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const modalPanel = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.985,
    transition: { duration: 0.18 },
  },
};

export default function BookingsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const DEFAULT_FILTERS = { q: "", date: "All", status: "All", sort: "Latest" };

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState(null);

  const [cancelModal, setCancelModal] = useState({
    open: false,
    bookingId: null,
    tourTitle: "",
    refCode: "",
  });

  const [infoModal, setInfoModal] = useState({
    open: false,
    title: "Write Review",
    message: "",
  });

  const openInfoModal = (message) =>
    setInfoModal({ open: true, title: "Write Review", message });

  const closeInfoModal = () =>
    setInfoModal({ open: false, title: "Write Review", message: "" });

  const inFlightRef = useRef(false);
  const lastKeyRef = useRef("");
  const draftFirstRunRef = useRef(true);
  const firstLoadRef = useRef(true);

  const userPagingRef = useRef(false);
  const [page, setPage] = useState(1);

  const [refreshNonce, setRefreshNonce] = useState(0);
  const [fadeState, setFadeState] = useState("out");

  useEffect(() => {
    const t = setTimeout(() => setFadeState("in"), 40);
    return () => clearTimeout(t);
  }, []);

  const scrollFullTop = useCallback(() => {
    const start = window.scrollY || window.pageYOffset;
    const duration = 650;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    let startTime = null;

    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = easeOutCubic(progress);

      if (window.__lenis?.scrollTo) {
        window.__lenis.scrollTo(start * (1 - eased), { immediate: true });
      } else {
        window.scrollTo(0, start * (1 - eased));
      }

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!userPagingRef.current) return;
    if (loading) return;

    scrollFullTop();
    userPagingRef.current = false;
  }, [page, loading, scrollFullTop]);

  const displayStatus = (b) => {
    return String(b?.booking_status || "").trim();
  };

  const load = async (f = filters, { smoothSwap = false, force = false } = {}) => {
    if (!token) {
      setRows([]);
      setLoading(false);
      requestAnimationFrame(() => setFadeState("in"));
      return;
    }

    const key = JSON.stringify({
      q: f.q,
      date: f.date,
      status: f.status,
    });

    if (inFlightRef.current) return;
    if (!force && lastKeyRef.current === key) return;

    try {
      inFlightRef.current = true;
      lastKeyRef.current = key;

      if (smoothSwap) setFadeState("out");
      setLoading(true);

      const res = await fetchMyBookings(f);
      const list = Array.isArray(res?.data) ? res.data : [];

      if (smoothSwap) await new Promise((r) => setTimeout(r, 140));

      setRows(list);
      setPage(1);

      requestAnimationFrame(() => setFadeState("in"));
    } catch (e) {
      console.error("Failed to load bookings", e);
      alert("Failed to load bookings.");
      setRows([]);
      setPage(1);
      requestAnimationFrame(() => setFadeState("in"));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      firstLoadRef.current = false;
    }
  };

  useEffect(() => {
    if (draftFirstRunRef.current) {
      draftFirstRunRef.current = false;
      return;
    }

    const id = setTimeout(() => {
      setFilters(draft);
      setPage(1);
    }, 350);

    return () => clearTimeout(id);
  }, [draft.q, draft.date, draft.status, draft.sort]);

  useEffect(() => {
    if (!token) {
      setRows([]);
      setLoading(false);
      requestAnimationFrame(() => setFadeState("in"));
      return;
    }

    const smooth = !firstLoadRef.current;
    load(filters, { smoothSwap: smooth, force: refreshNonce > 0 });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters.q, filters.date, filters.status, refreshNonce]);

  useEffect(() => {
    if (!token) return;

    const onFocus = () => {
      lastKeyRef.current = "";
      setRefreshNonce(Date.now());
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastKeyRef.current = "";
        setRefreshNonce(Date.now());
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  const StatusBadge = ({ status }) => {
    const map = {
      Pending: "bg-amber-500 text-white",
      Approved: "bg-indigo-600 text-white",
      Confirmed: "bg-emerald-700 text-white",
      Completed: "bg-gray-900 text-white",
      Cancelled: "bg-gray-400 text-white",
    };

    return (
      <motion.span
        whileHover={{ y: -1 }}
        className={[
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm",
          map[status] || "bg-gray-700 text-white",
        ].join(" ")}
        title="Current status"
      >
        {status}
      </motion.span>
    );
  };

  const PaymentChip = ({ paid }) => (
    <motion.span
      whileHover={{ y: -1 }}
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
        paid
          ? "bg-emerald-700 text-white border-emerald-700"
          : "bg-amber-50 text-amber-800 border-amber-100",
      ].join(" ")}
    >
      {paid ? "Paid" : "Unpaid"}
    </motion.span>
  );

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    lastKeyRef.current = "";
    setRefreshNonce(Date.now());
  };

  const handleRefresh = () => {
    lastKeyRef.current = "";
    setRefreshNonce(Date.now());
  };

  const handlePayNow = async (bookingId) => {
    if (busyId) return;

    try {
      setBusyId(bookingId);
      navigate(`/payment/${bookingId}`);
      handleRefresh();
    } catch (e) {
      console.error("Pay failed", e);
      alert(e?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openCancelModal = (b) => {
    setCancelModal({
      open: true,
      bookingId: b.id,
      tourTitle: b.tour_title || "",
      refCode: b.ref_code || "",
    });
  };

  const closeCancelModal = () => {
    setCancelModal({
      open: false,
      bookingId: null,
      tourTitle: "",
      refCode: "",
    });
  };

  const confirmCancel = async () => {
    const bookingId = cancelModal.bookingId;
    if (!bookingId || busyId) return;

    try {
      setBusyId(bookingId);
      await cancelBooking(bookingId);

      setRows((prev) =>
        prev.map((r) => (r.id === bookingId ? { ...r, booking_status: "Cancelled" } : r))
      );
      closeCancelModal();
      handleRefresh();
    } catch (e) {
      console.error("Cancel failed", e);
      alert(e?.response?.data?.message || "Cancel failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const SkeletonRow = ({ i }) => (
    <tr key={`sk-${i}`} className="animate-pulse">
      <td className="px-4 py-5">
        <div className="flex gap-3 items-center">
          <div className="h-12 w-16 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-3 w-44 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-5">
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-5">
        <div className="h-3 w-28 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-5">
        <div className="h-6 w-28 bg-gray-200 rounded-full" />
      </td>
      <td className="px-4 py-5">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </td>
      <td className="px-4 py-5">
        <div className="flex gap-2 justify-end">
          <div className="h-9 w-28 bg-gray-200 rounded-xl" />
          <div className="h-9 w-28 bg-gray-100 rounded-xl" />
        </div>
      </td>
    </tr>
  );

  const filteredRows = useMemo(() => {
    const list = Array.isArray(rows) ? [...rows] : [];

    const q = String(filters.q || "").trim().toLowerCase();
    const status = filters.status;
    const date = filters.date;

    let out = list;

    if (q) {
      out = out.filter((b) => {
        const t = String(b.tour_title || "").toLowerCase();
        const a = String(b.agency_name || "").toLowerCase();
        const r = String(b.ref_code || "").toLowerCase();
        return t.includes(q) || a.includes(q) || r.includes(q);
      });
    }

    if (date !== "All") {
      const now = Date.now();
      const days = date === "Last30" ? 30 : date === "Last90" ? 90 : 0;
      if (days > 0) {
        const since = now - days * 24 * 60 * 60 * 1000;
        out = out.filter((b) => {
          const ts = new Date(b.booking_date).getTime();
          return Number.isFinite(ts) && ts >= since;
        });
      }
    }

    if (status !== "All") {
      out = out.filter((b) => displayStatus(b) === status);
    }

    return out;
  }, [rows, filters.q, filters.date, filters.status]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    const dir = filters.sort === "Oldest" ? 1 : -1;

    list.sort((a, b) => {
      const da = new Date(a.booking_date).getTime() || 0;
      const db = new Date(b.booking_date).getTime() || 0;
      return (da - db) * dir;
    });

    return list;
  }, [filteredRows, filters.sort]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  }, [sortedRows.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const setSafePage = useCallback(
    async (next, tp) => {
      const n = Math.min(tp, Math.max(1, next));
      if (n === page) return;

      userPagingRef.current = true;

      setFadeState("out");
      await new Promise((r) => setTimeout(r, 140));

      setPage(n);
      requestAnimationFrame(() => setFadeState("in"));
    },
    [page]
  );

  const pagerBtn =
    "px-4 py-2.5 rounded-2xl text-sm font-semibold border " +
    "transition-all duration-300 ease-out transform active:scale-95 shadow-sm hover:shadow-md";

  const fadeWrapClass = fadeState === "in" ? "opacity-100" : "opacity-0";
  const transitionClass = "transition-opacity duration-500 ease-[cubic-bezier(.22,1,.36,1)]";

  return (
    <div className="relative bg-[#071510]">
      <div className="relative">
        <div className="fixed bottom-0 left-0 right-0 z-0">
          <FooterTourist />
        </div>

        <div className="relative z-10 bg-[#e6f4ec]">
          <NavbarTourist />

          <motion.main
            initial="hidden"
            animate="show"
            variants={pageIntro}
            className="pt-6 pb-6"
          >
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              <motion.div
                variants={sectionReveal}
                className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-lg md:text-xl font-semibold text-gray-900">Booking History</h1>
                    <p className="text-xs md:text-sm text-emerald-700 mt-1">
                      Your past and current bookings with status and payment details.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    title="Refresh bookings"
                  >
                    <motion.span
                      animate={loading ? { rotate: 360 } : { rotate: 0 }}
                      transition={loading ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0.2 }}
                    >
                      <FaRedo />
                    </motion.span>
                    Refresh
                  </motion.button>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
                  <motion.input
                    whileFocus={{ y: -1 }}
                    value={draft.q}
                    onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
                    placeholder="Filter: Tour or Agency"
                    className="w-full md:w-[320px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />

                  <motion.select
                    whileFocus={{ y: -1 }}
                    value={draft.date}
                    onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
                    className="w-full md:w-[170px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="All">Date: All</option>
                    <option value="Last30">Last 30 days</option>
                    <option value="Last90">Last 90 days</option>
                  </motion.select>

                  <motion.select
                    whileFocus={{ y: -1 }}
                    value={draft.status}
                    onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                    className="w-full md:w-[200px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="All">Status: All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </motion.select>

                  <motion.select
                    whileFocus={{ y: -1 }}
                    value={draft.sort}
                    onChange={(e) => setDraft((p) => ({ ...p, sort: e.target.value }))}
                    className="w-full md:w-[170px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="Latest">Latest</option>
                    <option value="Oldest">Oldest</option>
                  </motion.select>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className={[
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                      "hover:shadow-md active:shadow-sm",
                      "w-full md:w-auto justify-center border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <FaRedo /> Reset
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                variants={sectionReveal}
                className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {!token ? (
                  <div className="p-10 text-center">
                    <div className="font-semibold text-gray-900">Please login to view bookings</div>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/login")}
                      className={[
                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                        "hover:shadow-md active:shadow-sm",
                        "mt-4 bg-emerald-700 text-white hover:bg-emerald-800",
                      ].join(" ")}
                    >
                      Go to Login
                    </motion.button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[1050px] w-full">
                      <thead className="bg-emerald-50 text-gray-800">
                        <tr className="text-left text-xs uppercase tracking-wide">
                          <th className="px-4 py-3 font-bold">Tour</th>
                          <th className="px-4 py-3 font-bold">Agency</th>
                          <th className="px-4 py-3 font-bold whitespace-nowrap">Booking Date</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 font-bold">Payment</th>
                          <th className="px-4 py-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className={`divide-y divide-gray-100 ${transitionClass} ${fadeWrapClass}`}>
                        {loading ? (
                          Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} i={i} />)
                        ) : sortedRows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-sm text-gray-500">
                              No bookings found.
                            </td>
                          </tr>
                        ) : (
                          <AnimatePresence mode="popLayout" initial={false}>
                            {pageRows.map((b, index) => {
                              const statusText = displayStatus(b);
                              const cancelled = statusText === "Cancelled";
                              const completed = statusText === "Completed";
                              const approved = statusText === "Approved";
                              const paid = String(b.payment_status || "") === "Paid";
                              const unpaid = String(b.payment_status || "") === "Unpaid";
                              const listingCompleted =
                                String(b.agency_tour_listing_status || "").toLowerCase() ===
                                "completed";
                              const rowBusy = busyId === b.id;

                              const canPay = unpaid && !cancelled && approved;
                              const canWriteReview = paid && !cancelled && completed && listingCompleted;

                              return (
                                <motion.tr
                                  key={b.id}
                                  layout
                                  initial={{ opacity: 0, y: 14 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ duration: 0.22, delay: index * 0.03 }}
                                  className="hover:bg-gray-50/60 transition-colors"
                                >
                                  <td className="px-4 py-5">
                                    <div className="flex gap-3 items-center">
                                      <motion.img
                                        whileHover={{ scale: 1.03 }}
                                        src={toPublicImageUrl(b.tour_image_url) || FALLBACK_TOUR_IMG}
                                        alt={b.tour_title}
                                        className="h-12 w-16 rounded-xl object-cover border"
                                        onError={(e) => (e.currentTarget.src = FALLBACK_TOUR_IMG)}
                                      />
                                      <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 leading-tight line-clamp-2">
                                          {b.tour_title}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1.5">Ref. #{b.ref_code}</div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-5 font-semibold text-gray-900">{b.agency_name}</td>

                                  <td className="px-4 py-5 whitespace-nowrap font-semibold text-gray-900">
                                    {new Date(b.booking_date).toLocaleDateString()}
                                  </td>

                                  <td className="px-4 py-5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-gray-500 font-semibold">Current:</span>
                                      <StatusBadge status={statusText} />
                                    </div>
                                  </td>

                                  <td className="px-4 py-5">
                                    <PaymentChip paid={paid} />
                                  </td>

                                  <td className="px-4 py-5">
                                    <div className="flex gap-2 justify-end flex-nowrap">
                                      {canPay && (
                                        <motion.button
                                          whileHover={{ y: -1 }}
                                          whileTap={{ scale: 0.98 }}
                                          disabled={rowBusy}
                                          onClick={() => handlePayNow(b.id)}
                                          className={[
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                                            "hover:shadow-md active:shadow-sm",
                                            rowBusy
                                              ? "bg-emerald-300 text-white cursor-not-allowed animate-pulse"
                                              : "bg-emerald-700 text-white hover:bg-emerald-800",
                                          ].join(" ")}
                                        >
                                          <FaCreditCard />
                                          {rowBusy ? "Processing..." : "Pay Now"}
                                        </motion.button>
                                      )}

                                      {paid && !cancelled && (
                                        <motion.button
                                          whileHover={{ y: -1 }}
                                          whileTap={{ scale: 0.98 }}
                                          onClick={() => {
                                            if (!canWriteReview) {
                                              openInfoModal(
                                                "You can write a review only when your paid booking is completed and the agency tour is still marked as completed."
                                              );
                                              return;
                                            }
                                            navigate(`/review?booking=${b.id}`);
                                          }}
                                          className={[
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                                            "hover:shadow-md active:shadow-sm",
                                            canWriteReview
                                              ? "bg-emerald-700 text-white hover:bg-emerald-800"
                                              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50",
                                          ].join(" ")}
                                        >
                                          <FaPen /> Write Review
                                        </motion.button>
                                      )}

                                      {!paid && !cancelled && (
                                        <motion.button
                                          whileHover={{ y: -1 }}
                                          whileTap={{ scale: 0.98 }}
                                          disabled={rowBusy}
                                          onClick={() => openCancelModal(b)}
                                          className={[
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                                            "hover:shadow-md active:shadow-sm",
                                            rowBusy
                                              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                              : "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300",
                                          ].join(" ")}
                                        >
                                          <FaTimes />
                                          {rowBusy ? "Cancelling..." : "Cancel"}
                                        </motion.button>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {!loading && token && sortedRows.length > PAGE_SIZE && (
                <motion.div
                  variants={sectionReveal}
                  className="mt-7 flex items-center justify-center gap-3"
                >
                  <motion.button
                    whileHover={page === 1 ? {} : { y: -1 }}
                    whileTap={page === 1 ? {} : { scale: 0.98 }}
                    onClick={() => setSafePage(page - 1, totalPages)}
                    disabled={page === 1}
                    className={`${pagerBtn} ${
                      page === 1
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                        : "bg-white text-gray-900 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 hover:-translate-y-0.5"
                    }`}
                  >
                    Prev
                  </motion.button>

                  <motion.div
                    whileHover={{ y: -1 }}
                    className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-sm"
                  >
                    Page {page} / {totalPages}
                  </motion.div>

                  <motion.button
                    whileHover={page === totalPages ? {} : { y: -1 }}
                    whileTap={page === totalPages ? {} : { scale: 0.98 }}
                    onClick={() => setSafePage(page + 1, totalPages)}
                    disabled={page === totalPages}
                    className={`${pagerBtn} ${
                      page === totalPages
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                        : "bg-white text-gray-900 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 hover:-translate-y-0.5"
                    }`}
                  >
                    Next
                  </motion.button>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {cancelModal.open && (
                <motion.div
                  variants={modalBackdrop}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeCancelModal();
                  }}
                >
                  <motion.div
                    variants={modalPanel}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.92 }}
                          animate={{ scale: 1 }}
                          className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100"
                        >
                          <FaExclamationTriangle />
                        </motion.div>
                        <div>
                          <div className="text-base font-bold text-gray-900">Cancel Booking?</div>
                          <div className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</div>
                        </div>
                      </div>

                      <button
                        onClick={closeCancelModal}
                        className="text-gray-400 hover:text-gray-700 transition"
                        title="Close"
                      >
                        <FaTimesCircle size={20} />
                      </button>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="text-sm text-gray-800">
                        <span className="font-semibold">{cancelModal.tourTitle}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Ref: <span className="font-semibold">#{cancelModal.refCode}</span>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2 justify-end">
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={closeCancelModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:shadow-md active:shadow-sm"
                      >
                        Keep Booking
                      </motion.button>

                      <motion.button
                        whileHover={busyId === cancelModal.bookingId ? {} : { y: -1 }}
                        whileTap={busyId === cancelModal.bookingId ? {} : { scale: 0.98 }}
                        disabled={busyId === cancelModal.bookingId}
                        onClick={confirmCancel}
                        className={[
                          "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                          "hover:shadow-md active:shadow-sm",
                          busyId === cancelModal.bookingId
                            ? "bg-red-300 text-white cursor-not-allowed animate-pulse"
                            : "bg-red-600 text-white hover:bg-red-700",
                        ].join(" ")}
                      >
                        {busyId === cancelModal.bookingId ? "Cancelling..." : "Yes, Cancel"}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {infoModal.open && (
                <motion.div
                  variants={modalBackdrop}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 px-4"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeInfoModal();
                  }}
                >
                  <motion.div
                    variants={modalPanel}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="p-5 border-b border-gray-100 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.92 }}
                          animate={{ scale: 1 }}
                          className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100"
                        >
                          <FaInfoCircle />
                        </motion.div>
                        <div>
                          <div className="text-base font-bold text-gray-900">{infoModal.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Quick info</div>
                        </div>
                      </div>

                      <button
                        onClick={closeInfoModal}
                        className="text-gray-400 hover:text-gray-700 transition"
                        title="Close"
                      >
                        <FaTimesCircle size={20} />
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="text-sm text-gray-700">{infoModal.message}</div>
                    </div>

                    <div className="p-5 pt-0 flex justify-end">
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={closeInfoModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 bg-emerald-700 text-white hover:bg-emerald-800 hover:shadow-md active:shadow-sm"
                      >
                        Okay
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>

        <div className="pointer-events-none relative z-10 h-[calc(100vh-68px)] md:h-[calc(100vh-80px)]" />
      </div>
    </div>
  );
}