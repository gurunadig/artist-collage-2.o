"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearTokens, setTokens } from "./api";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("ac_access");
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      login: (access: string, refresh: string, nextUser: User) => {
        setTokens(access, refresh);
        setUser(nextUser);
      },
      logout: () => {
        clearTokens();
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
