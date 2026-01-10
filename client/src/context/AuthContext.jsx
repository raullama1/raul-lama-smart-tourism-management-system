// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi, signup as signupApi, me as meApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    loading: true,
  });

  // Load saved auth + verify token once on app start (refresh)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("tn_auth");

    // No saved auth -> stop loading
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

    // Saved but missing token -> treat as logged out
    if (!parsed?.token) {
      localStorage.removeItem("tn_auth");
      setAuth({ user: null, token: null, loading: false });
      return;
    }

    // Set token immediately so API calls work, then verify token with /auth/me
    setAuth({ user: parsed.user || null, token: parsed.token, loading: true });

    (async () => {
      try {
        const res = await meApi(); // { user }
        const next = { user: res.user, token: parsed.token, loading: false };
        setAuth(next);
        localStorage.setItem("tn_auth", JSON.stringify({ user: res.user, token: parsed.token }));
      } catch (err) {
        // Token invalid/expired -> clear saved auth
        localStorage.removeItem("tn_auth");
        setAuth({ user: null, token: null, loading: false });
      }
    })();
  }, []);

  const saveAuth = (data) => {
    const next = {
      user: data.user,
      token: data.token,
      loading: false,
    };

    setAuth(next);

    if (typeof window !== "undefined") {
      localStorage.setItem("tn_auth", JSON.stringify({ user: data.user, token: data.token }));
    }
  };

  const login = async (email, password) => {
    const res = await loginApi(email, password); // { token, user }
    saveAuth(res);
  };

  const signup = async (name, email, password, verificationCode) => {
    const res = await signupApi(name, email, password, verificationCode); // { token, user }
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
        isAuthenticated: !!auth.token,
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
