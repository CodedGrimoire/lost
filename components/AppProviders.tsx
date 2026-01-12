"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "@/app/providers/AuthProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-text)",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
