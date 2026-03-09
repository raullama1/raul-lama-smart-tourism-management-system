// client/src/context/AdminAuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminLogin as adminLoginApi, adminMe as adminMeApi } from "../api/adminAuthApi";

const AdminAuthContext = createContext(null);

const STORAGE_KEY = "tn_admin_auth";

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState({
    admin: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      setAuth({ admin: null, token: null, loading: false });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ admin: null, token: null, loading: false });
      return;
    }

    const token = parsed?.token;
    if (!token) {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ admin: null, token: null, loading: false });
      return;
    }

    adminMeApi(token)
      .then((data) => {
        const admin = data?.admin || null;
        if (!admin) {
          localStorage.removeItem(STORAGE_KEY);
          setAuth({ admin: null, token: null, loading: false });
          return;
        }

        const next = { admin, token, loading: false };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ admin, token }));
        setAuth(next);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setAuth({ admin: null, token: null, loading: false });
      });
  }, []);

  const login = async (identifier, password) => {
    const data = await adminLoginApi(identifier, password);
    const admin = data?.admin || null;
    const token = data?.token || null;

    if (!admin || !token) {
      throw new Error("Invalid admin login response.");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ admin, token }));
    setAuth({ admin, token, loading: false });

    return data;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ admin: null, token: null, loading: false });
  };

  const value = useMemo(
    () => ({
      admin: auth.admin,
      token: auth.token,
      loading: auth.loading,
      isAuthenticated: !!auth.admin && !!auth.token,
      login,
      logout,
    }),
    [auth]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }

  return ctx;
}