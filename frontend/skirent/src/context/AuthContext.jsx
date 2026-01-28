import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // משתמש דמה כדי שהמערכת תעלה בלי Backend כרגע
  const [user, setUser] = useState({ role: "admin", username: "demo" });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      login: (newUser) => {
        setUser(newUser);
        setIsAuthenticated(true);
      },
      logout: () => {
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
