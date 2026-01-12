"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearAuthTokenCookie,
  setAuthTokenCookie,
} from "@/lib/utils";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  token: string;
  loading: boolean;
  setSession: (token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        const idToken = await nextUser.getIdToken();
        setToken(idToken);
        setAuthTokenCookie(idToken);
      } else {
        setUser(null);
        setToken("");
        clearAuthTokenCookie();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setSession: async (nextToken: string) => {
        setAuthTokenCookie(nextToken);
        setToken(nextToken);
        setLoading(false);
      },
      refreshUser: async () => {
        const current = firebaseAuth.currentUser;
        if (!current) return;
        const idToken = await current.getIdToken(true);
        setAuthTokenCookie(idToken);
        setToken(idToken);
        setUser(current);
      },
      logout: async () => {
        await signOut(firebaseAuth);
        clearAuthTokenCookie();
        setToken("");
        setUser(null);
      },
      loginWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        const credentials = await signInWithPopup(firebaseAuth, provider);
        const idToken = await credentials.user.getIdToken();
        setAuthTokenCookie(idToken);
        setToken(idToken);
        setUser(credentials.user);
      },
    }),
    [loading, token, user],
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
