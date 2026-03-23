"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Account } from "../lib/types";

type AuthState = {
  token: string | null;
  account: Account | null;
  hydrated: boolean;
  setSession: (token: string, account: Account) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "eventsfinder-token";
const ACCOUNT_KEY = "eventsfinder-account";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    const savedAccount = window.localStorage.getItem(ACCOUNT_KEY);
    if (savedToken && savedAccount) {
      setToken(savedToken);
      setAccount(JSON.parse(savedAccount) as Account);
    }
    setHydrated(true);
  }, []);

  function setSession(nextToken: string, nextAccount: Account) {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(nextAccount));
    setToken(nextToken);
    setAccount(nextAccount);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(ACCOUNT_KEY);
    setToken(null);
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ token, account, hydrated, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
