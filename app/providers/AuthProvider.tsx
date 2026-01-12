"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient } from "@/lib/apiClient";
import {
  clearAuthTokenCookie,
  getAuthTokenFromCookie,
  setAuthTokenCookie,
} from "@/lib/utils";

type AuthUser = {
  uid?: string;
  email?: string;
  name?: string;
  picture?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string;
  loading: boolean;
  setSession: (token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(
    async (nextToken: string) => {
      try {
        const profile = await apiClient.get<AuthUser>("/api/user/me", {
          authenticated: true,
          headers: { Authorization: `Bearer ${nextToken}` },
        });
        setUser(profile);
      } catch (error) {
        console.error("Failed to load user profile", error);
        clearAuthTokenCookie();
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const existing = getAuthTokenFromCookie();
    if (existing) {
      setToken(existing);
      fetchUser(existing);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setSession: async (nextToken: string) => {
        setAuthTokenCookie(nextToken);
        setToken(nextToken);
        await fetchUser(nextToken);
      },
      refreshUser: async () => {
        if (!token) return;
        await fetchUser(token);
      },
      logout: () => {
        clearAuthTokenCookie();
        setToken("");
        setUser(null);
      },
      loginWithGoogle: async () => {
        throw new Error("Google login is not configured yet.");
      },
    }),
    [fetchUser, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
