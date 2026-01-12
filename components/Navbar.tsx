"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/providers/AuthProvider";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    router.push("/");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/items", label: "Items" },
    token
      ? { href: "/add-item", label: "Report Item" }
      : { href: "/login", label: "Login" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-base bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-base bg-white">
            <Image src="/logo.jpeg" alt="CampusLost+Found logo" fill sizes="40px" />
          </div>
          <span className="text-lg">CampusLost+Found</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                pathname === link.href
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              {link.label}
            </Link>
          ))}
          {token ? (
            <>
              {user?.email ? (
                <span className="px-2 text-sm font-semibold text-primary">
                  {user.email}
                </span>
              ) : null}
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm font-semibold"
              >
                Logout
              </button>
            </>
          ) : null}
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="ml-2 rounded-full border border-base p-2 text-lg transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            {mounted ? (theme === "dark" || resolvedTheme === "dark" ? "🌙" : "☀️") : "…"}
          </button>
        </nav>

        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            className="rounded-full border border-base p-2"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-base bg-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-semibold transition",
                pathname === link.href
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                {link.label}
              </Link>
            ))}
            {token ? (
              <>
                {user?.email ? (
                  <p className="rounded-xl border border-base px-3 py-2 text-sm font-semibold text-primary">
                    {user.email}
                  </p>
                ) : null}
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-base px-3 py-2 text-left text-sm font-semibold"
                >
                  Logout
                </button>
              </>
            ) : null}
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-xl border border-base px-3 py-2 text-left text-sm font-semibold"
            >
              {mounted
                ? theme === "dark" || resolvedTheme === "dark"
                  ? "🌙 Dark"
                  : "☀️ Light"
                : "…"}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
