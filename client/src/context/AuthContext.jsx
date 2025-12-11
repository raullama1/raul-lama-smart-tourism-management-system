// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginApi,
  signup as signupApi,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    loading: true,
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("tn_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuth({ ...parsed, loading: false });
      } catch (e) {
        console.error("Failed to parse stored auth", e);
        setAuth((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setAuth((prev) => ({ ...prev, loading: false }));
    }
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
    const res = await loginApi(email, password);
    saveAuth(res);
  };

  // 🔐 Signup now requires verificationCode
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
