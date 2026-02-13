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

  /*
    On app start:
    - load saved token/user from localStorage
    - set token immediately (so protected API calls can work)
    - then verify token by calling /auth/me
  */
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

    setAuth({ user: parsed.user || null, token: parsed.token, loading: true });

    (async () => {
      try {
        // Your authApi.js should attach token automatically (or read from localStorage).
        const res = await meApi(); // expected: { user }
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
    const res = await loginApi(email, password); // expected: { token, user }
    saveAuth(res);
  };

  const signup = async (name, email, password, verificationCode) => {
    const res = await signupApi(name, email, password, verificationCode); // expected: { token, user }
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
