// client/src/context/AgencyAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  agencyLogin as loginApi,
  agencyMe as meApi,
  agencyRegister as registerApi,
} from "../api/agencyAuthApi";

const AgencyAuthContext = createContext(null);

const STORAGE_KEY = "tn_agency_auth";

export function AgencyAuthProvider({ children }) {
  const [auth, setAuth] = useState({
    agency: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      setAuth({ agency: null, token: null, loading: false });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ agency: null, token: null, loading: false });
      return;
    }

    if (!parsed?.token) {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ agency: null, token: null, loading: false });
      return;
    }

    if (parsed?.agency?.role && parsed.agency.role !== "agency") {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ agency: null, token: null, loading: false });
      return;
    }

    if (parsed?.agency?.is_blocked) {
      localStorage.removeItem(STORAGE_KEY);
      setAuth({ agency: null, token: null, loading: false });
      return;
    }

    setAuth({
      agency: parsed.agency || null,
      token: parsed.token,
      loading: true,
    });

    (async () => {
      try {
        const res = await meApi();

        if (
          !res?.agency ||
          res.agency.role !== "agency" ||
          res.agency.is_blocked
        ) {
          localStorage.removeItem(STORAGE_KEY);
          setAuth({ agency: null, token: null, loading: false });
          return;
        }

        const next = { agency: res.agency, token: parsed.token, loading: false };
        setAuth(next);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ agency: res.agency, token: parsed.token })
        );
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setAuth({ agency: null, token: null, loading: false });
      }
    })();
  }, []);

  const saveAuth = (data) => {
    if (!data?.agency || data.agency.role !== "agency" || data.agency.is_blocked) {
      throw new Error("Only active agency accounts are allowed here.");
    }

    const next = { agency: data.agency, token: data.token, loading: false };
    setAuth(next);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ agency: data.agency, token: data.token })
      );
    }
  };

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    saveAuth(res);
  };

  const register = async (payload) => {
    const res = await registerApi(payload);
    return res;
  };

  const logout = () => {
    setAuth({ agency: null, token: null, loading: false });
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AgencyAuthContext.Provider
      value={{
        agency: auth.agency,
        token: auth.token,
        loading: auth.loading,
        isAuthenticated:
          !!auth.token &&
          auth.agency?.role === "agency" &&
          !auth.agency?.is_blocked,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AgencyAuthContext.Provider>
  );
}

export function useAgencyAuth() {
  return useContext(AgencyAuthContext);
}