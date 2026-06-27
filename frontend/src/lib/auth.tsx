"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  getToken,
  login as apiLogin,
  setToken,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";
import type { AuthUser } from "@/lib/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Validate any stored token on first load.
  useEffect(() => {
    if (!getToken()) {
      setStatus("unauthenticated");
      return;
    }
    let ignore = false;
    getMe()
      .then((me) => {
        if (ignore) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (ignore) return;
        setToken(null);
        setStatus("unauthenticated");
      });
    return () => {
      ignore = true;
    };
  }, []);

  // React to 401s surfaced by the API client (e.g. expired token).
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
