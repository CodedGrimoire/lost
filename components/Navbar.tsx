"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/providers/AuthProvider";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { HiChartBar, HiUser, HiLogout, HiMoon, HiSun, HiX, HiMenu } from "react-icons/hi";

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside or navigating
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profileDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  // Close dropdown when pathname changes
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    router.push("/");
    setProfileDropdownOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/items", label: "Items" },
    ...(token ? [
      { href: "/add-item", label: "Report Item" },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-base bg-surface backdrop-blur-lg shadow-sm">
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
              {user ? (
                <div className="relative profile-dropdown-container">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-base bg-card px-3 py-1.5 transition hover:border-primary hover:shadow-sm"
                  >
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-base bg-primary/10">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || user.email || "User"}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-blue-2 text-xs font-bold text-white">
                          {(user.displayName || user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {user.displayName || user.email?.split("@")[0] || "User"}
                    </span>
                    <svg
                      className={cn(
                        "h-4 w-4 text-muted transition-transform",
                        profileDropdownOpen && "rotate-180"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-base bg-card shadow-lg backdrop-blur-lg">
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm transition",
                            pathname === "/dashboard"
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <HiChartBar className="text-lg" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm transition",
                            pathname === "/profile"
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <HiUser className="text-lg" />
                          <span>My Profile</span>
                        </Link>
                        <div className="my-1 border-t border-base" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted transition hover:bg-error/10 hover:text-error"
                        >
                          <HiLogout className="text-lg" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  pathname === "/login"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  pathname === "/signup"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                Sign Up
              </Link>
            </>
          )}
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="ml-2 rounded-full border border-base p-2 text-lg transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            {mounted ? (theme === "dark" || resolvedTheme === "dark" ? <HiMoon /> : <HiSun />) : "…"}
          </button>
        </nav>

        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            className="rounded-full border border-base p-2"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <HiX className="text-lg" /> : <HiMenu className="text-lg" />}
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
                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-base bg-card px-3 py-2">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-base bg-primary/10">
                        {user.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt={user.displayName || user.email || "User"}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-blue-2 text-sm font-bold text-white">
                            {(user.displayName || user.email || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary">
                          {user.displayName || user.email?.split("@")[0] || "User"}
                        </p>
                        {user.email && user.displayName && (
                          <p className="text-xs text-muted">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                        pathname === "/dashboard"
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <HiChartBar /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                        pathname === "/profile"
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <HiUser /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-xl border border-base px-3 py-2 text-left text-sm font-semibold"
                    >
                      <HiLogout /> Logout
                    </button>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    pathname === "/login"
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    pathname === "/signup"
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 rounded-xl border border-base px-3 py-2 text-left text-sm font-semibold"
            >
              {mounted
                ? theme === "dark" || resolvedTheme === "dark"
                  ? <><HiMoon /> Dark</>
                  : <><HiSun /> Light</>
                : "…"}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
