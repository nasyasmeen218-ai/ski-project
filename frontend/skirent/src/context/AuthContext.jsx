import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { me as meApi } from "../api/authApi";

const AuthContext = createContext(null);

function safeGetToken() {
  try {
    return localStorage.getItem("token");
  } catch (e) {
    console.warn("Cannot access localStorage token:", e);
    return null;
  }
}

function safeClearAuthStorage() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
  } catch (e) {
    console.warn("Cannot access localStorage:", e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ✅ On app start (or refresh): if token exists -> fetch /auth/me
  useEffect(() => {
    const boot = async () => {
      const token = safeGetToken();

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingUser(false);
        return;
      }

      try {
        setIsLoadingUser(true);
        const me = await meApi(); // uses axios interceptor Authorization Bearer token
        setUser(me);
        setIsAuthenticated(true);

        // optional: keep localStorage in sync (not source of truth)
        try {
          localStorage.setItem("role", me.role);
          localStorage.setItem("username", me.username);
        } catch {}
      } catch (e) {
        console.error("Failed to load /auth/me:", e);
        // token invalid/expired -> clear
        safeClearAuthStorage();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoadingUser(false);
      }
    };

    boot();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoadingUser,
      // login is handled by Login.jsx saving token.
      // This is for syncing user after login without refresh:
      refreshMe: async () => {
        try {
          const token = safeGetToken();
          if (!token) {
            setUser(null);
            setIsAuthenticated(false);
            return null;
          }
          const me = await meApi();
          setUser(me);
          setIsAuthenticated(true);
          try {
            localStorage.setItem("role", me.role);
            localStorage.setItem("username", me.username);
          } catch {}
          return me;
        } catch (e) {
          console.error("refreshMe failed:", e);
          safeClearAuthStorage();
          setUser(null);
          setIsAuthenticated(false);
          return null;
        }
      },
      logout: () => {
        safeClearAuthStorage();
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [user, isAuthenticated, isLoadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
