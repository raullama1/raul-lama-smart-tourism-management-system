import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchWishlistIds,
  addToWishlist as apiAdd,
  removeFromWishlist as apiRemove,
} from "../api/wishlistApi";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, token } = useAuth();

  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const refresh = async () => {
    if (!isAuthenticated || !token) {
      setIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const res = await fetchWishlistIds(token); // ✅ pass token
      const list = res?.ids || res?.data || [];  // supports both shapes
      setIds(new Set((list || []).map((x) => Number(x))));
    } catch (e) {
      console.error("Wishlist refresh failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const isWishlisted = (tourId) => ids.has(Number(tourId));

  const add = async (tourId) => {
    const idNum = Number(tourId);

    if (!token) {
      alert("Please login or signup to access this feature.");
      return { ok: false };
    }

    // ✅ instant client-side duplicate guard
    if (ids.has(idNum)) {
      alert("Already added to wishlist ✅");
      return { ok: true, already: true };
    }

    try {
      setBusyId(idNum);
      await apiAdd(token, idNum);

      setIds((prev) => {
        const next = new Set(prev);
        next.add(idNum);
        return next;
      });

      return { ok: true };
    } catch (e) {
      const status = e?.response?.status;
      const msg = String(e?.response?.data?.message || "").toLowerCase();

      // ✅ backend duplicate (409) OR message contains already
      if (status === 409 || msg.includes("already")) {
        alert("Already added to wishlist ✅");
        setIds((prev) => {
          const next = new Set(prev);
          next.add(idNum);
          return next;
        });
        return { ok: true, already: true };
      }

      console.error("Wishlist add failed:", e);
      alert("Wishlist update failed. Please try again.");
      return { ok: false };
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (tourId) => {
    const idNum = Number(tourId);

    if (!token) {
      alert("Please login or signup to access this feature.");
      return { ok: false };
    }

    try {
      setBusyId(idNum);
      await apiRemove(token, idNum);

      setIds((prev) => {
        const next = new Set(prev);
        next.delete(idNum);
        return next;
      });

      return { ok: true };
    } catch (e) {
      console.error("Wishlist remove failed:", e);
      alert("Remove failed. Please try again.");
      return { ok: false };
    } finally {
      setBusyId(null);
    }
  };

  const value = useMemo(
    () => ({ ids, loading, busyId, refresh, isWishlisted, add, remove }),
    [ids, loading, busyId]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
