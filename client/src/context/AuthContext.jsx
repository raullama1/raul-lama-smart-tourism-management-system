// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginApi,
  signup as signupApi,
  me as meApi,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("tn_auth");

    if (!stored) {
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored auth", e);
      localStorage.removeItem("tn_auth");
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    if (!parsed?.token) {
      localStorage.removeItem("tn_auth");
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    if (parsed?.user?.role && parsed.user.role !== "tourist") {
      localStorage.removeItem("tn_auth");
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    if (parsed?.user?.is_blocked) {
      localStorage.removeItem("tn_auth");
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    setAuth({ user: parsed.user || null, token: parsed.token, loading: true });

    (async () => {
      try {
        const res = await meApi();

        if (
          !res?.user ||
          res.user.role !== "tourist" ||
          res.user.is_blocked
        ) {
          localStorage.removeItem("tn_auth");
          setAuth({ user: null, token: null, loading: false });
          return;
        }

        const next = { user: res.user, token: parsed.token, loading: false };
        setAuth(next);

        localStorage.setItem(
          "tn_auth",
          JSON.stringify({ user: res.user, token: parsed.token })
        );
      } catch (err) {
        localStorage.removeItem("tn_auth");
        setAuth({ user: null, token: null, loading: false });
      }
    })();
  }, []);

  const saveAuth = (data) => {
    if (!data?.user || data.user.role !== "tourist" || data.user.is_blocked) {
      throw new Error("Only active tourist accounts are allowed here.");
    }

    const next = {
      user: data.user,
      token: data.token,
      loading: false,
    };

    setAuth(next);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "tn_auth",
        JSON.stringify({ user: data.user, token: data.token })
      );
    }
  };

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    saveAuth(res);
  };

  const signup = async (name, email, password, verificationCode) => {
    const res = await signupApi(name, email, password, verificationCode);
    saveAuth(res);
  };

  const logout = () => {
    setAuth({ user: null, token: null, loading: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem("tn_auth");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        loading: auth.loading,
        isAuthenticated:
          !!auth.token &&
          auth.user?.role === "tourist" &&
          !auth.user?.is_blocked,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}