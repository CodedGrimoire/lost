"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/providers/AuthProvider";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { HiChartBar, HiUser, HiLogout, HiMoon, HiSun, HiX, HiMenu, HiBell, HiLocationMarker } from "react-icons/hi";
import { apiClient } from "@/lib/apiClient";
import { Notification } from "@/types/item";

export default function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
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
    setNotificationDropdownOpen(false);
  }, [pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!token || !mounted) return;

    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const data = await apiClient.get<Notification[]>("/api/notifications", { authenticated: true });
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, mounted]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (notificationDropdownOpen && !target.closest('.notification-dropdown-container')) {
        setNotificationDropdownOpen(false);
      }
    };

    if (notificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notificationDropdownOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await apiClient.patch(
          `/api/notifications/${notification._id}/read`,
          {},
          { authenticated: true }
        );
        // Update local state
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
    setNotificationDropdownOpen(false);
    router.push(`/items/${notification.itemId}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
              {/* Notification Bell */}
              <div className="relative notification-dropdown-container">
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="relative rounded-full border border-base p-2 text-lg transition hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Notifications"
                >
                  <HiBell />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-base bg-card shadow-lg backdrop-blur-lg">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-base">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                      </div>
                      {loadingNotifications ? (
                        <div className="p-4 text-center text-sm text-muted">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted">No notifications</div>
                      ) : (
                        <div className="py-1">
                          {notifications.map((notification) => (
                            <button
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5",
                                !notification.read && "bg-primary/5 font-semibold"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                  !notification.read ? "bg-primary" : "bg-transparent"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs", !notification.read ? "font-semibold" : "text-muted")}>
                                    {notification.message.split("Meetup address:")[0].trim()}
                                  </p>
                                  {notification.message.includes("Meetup address:") && (
                                    <div className="mt-2 rounded border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
                                      <div className="flex items-start gap-1.5">
                                        <HiLocationMarker className="mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                                            Meetup Address:
                                          </p>
                                          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                                            {notification.message.split("Meetup address:")[1]?.trim()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted mt-1">
                                    {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
