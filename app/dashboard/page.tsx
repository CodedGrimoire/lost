"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import { Item, Claim } from "@/types/item";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import { Loader } from "@/components/Loader";
import { Skeleton } from "@/components/Skeleton";
import { HiUser, HiCube, HiSearch, HiCheckCircle, HiCalendar, HiPlus, HiInbox, HiClock, HiX, HiLocationMarker } from "react-icons/hi";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, router, token]);

  useEffect(() => {
    if (!token || !user?.email) return;

    const fetchUserItems = async () => {
      try {
        const userItems = await apiClient.get<Item[]>(
          `/api/user/items?email=${encodeURIComponent(user.email!)}`,
          { authenticated: true }
        );
        setItems(Array.isArray(userItems) ? userItems : []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load your items.";
        toast.error(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [token, user?.email]);

  // Fetch user's claims
  useEffect(() => {
    if (!token) return;

    const fetchClaims = async () => {
      setLoadingClaims(true);
      try {
        const userClaims = await apiClient.get<Claim[]>(
          "/api/claims/my-claims",
          { authenticated: true }
        );
        setClaims(Array.isArray(userClaims) ? userClaims : []);
      } catch (err) {
        console.error("Error fetching claims:", err);
        setClaims([]);
      } finally {
        setLoadingClaims(false);
      }
    };

    fetchClaims();
  }, [token]);

  const stats = useMemo(() => {
    const lostCount = items.filter((item) => item.status === "lost").length;
    const foundCount = items.filter((item) => item.status === "found").length;
    const totalCount = items.length;
    const recentCount = items.filter((item) => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    }).length;

    return {
      total: totalCount,
      lost: lostCount,
      found: foundCount,
      recent: recentCount,
    };
  }, [items]);

  if (!mounted || authLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton variant="rectangular" className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
          ))}
        </div>
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Dashboard Header */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted mt-1">Welcome back, {displayName}!</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/claims"
              className="flex items-center gap-2 rounded-lg border border-base bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:shadow-md"
            >
              <HiSearch /> Manage Claims
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg border border-base bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:shadow-md"
            >
              <HiUser /> View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">Total Items</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HiCube className="text-2xl" />
            </div>
          </div>
          <p className="text-xs text-muted">All your reported items</p>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">Lost Items</p>
              <p className="text-3xl font-bold text-warning">{stats.lost}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <HiSearch className="text-2xl" />
            </div>
          </div>
          <p className="text-xs text-muted">Items you've lost</p>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">Found Items</p>
              <p className="text-3xl font-bold text-success">{stats.found}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <HiCheckCircle className="text-2xl" />
            </div>
          </div>
          <p className="text-xs text-muted">Items you've found</p>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">This Week</p>
              <p className="text-3xl font-bold text-info">{stats.recent}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
              <HiCalendar className="text-2xl" />
            </div>
          </div>
          <p className="text-xs text-muted">Items reported this week</p>
        </div>
      </div>

      {/* Your Items Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Reported Items</h2>
            <p className="text-muted text-sm mt-1">
              {items.length === 0
                ? "You haven't reported any items yet."
                : `You have reported ${items.length} item${items.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <Link
            href="/add-item"
            className="btn btn-primary flex items-center gap-2"
          >
            <HiPlus /> Report New Item
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-base bg-surface py-12">
            <HiInbox className="text-6xl text-muted" />
            <div className="text-center">
              <h3 className="text-xl font-semibold">No items reported yet</h3>
              <p className="text-muted mt-1">Start helping the community by reporting a lost or found item!</p>
            </div>
            <Link href="/add-item" className="btn btn-primary mt-4">
              Report Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* My Claims Section */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Claims</h2>
          <Link
            href="/my-claims"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View All →
          </Link>
        </div>
        {loadingClaims ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-base bg-surface py-8">
            <HiInbox className="text-4xl text-muted" />
            <p className="text-sm text-muted">No claims submitted yet</p>
            <Link href="/items" className="btn btn-primary mt-2 text-sm">
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.slice(0, 3).map((claim) => (
              <div
                key={claim._id}
                className={`rounded-lg border p-3 ${
                  claim.status === "approved"
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : claim.status === "pending"
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                    : claim.status === "rejected"
                    ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"
                    : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/items/${claim.itemId}`}
                        className="font-semibold text-primary hover:underline truncate"
                      >
                        {claim.itemTitle}
                      </Link>
                      <span
                        className={`badge text-xs ${
                          claim.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : claim.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : claim.status === "rejected"
                            ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {claim.status === "approved" && <HiCheckCircle className="mr-1" />}
                        {claim.status === "pending" && <HiClock className="mr-1" />}
                        {claim.status === "rejected" && <HiX className="mr-1" />}
                        {claim.status === "received" && <HiCheckCircle className="mr-1" />}
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </div>
                    {claim.status === "approved" && claim.meetupAddress && (
                      <div className="mt-2 rounded border border-green-300 bg-white p-2 dark:border-green-700 dark:bg-green-950/30">
                        <div className="flex items-start gap-1.5">
                          <HiLocationMarker className="mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0 text-sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                              Meetup:
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400 truncate">
                              {claim.meetupAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted mt-1">
                      {new Date(claim.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {claims.length > 3 && (
              <Link
                href="/my-claims"
                className="block text-center text-sm font-semibold text-primary hover:underline py-2"
              >
                View all {claims.length} claims →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/add-item"
            className="flex flex-col items-center gap-3 rounded-lg border border-base bg-surface p-6 text-center transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <HiPlus className="text-3xl" />
            </div>
            <h3 className="font-semibold">Report Item</h3>
            <p className="text-sm text-muted">Report a lost or found item</p>
          </Link>
          <Link
            href="/items"
            className="flex flex-col items-center gap-3 rounded-lg border border-base bg-surface p-6 text-center transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <HiSearch className="text-3xl" />
            </div>
            <h3 className="font-semibold">Browse All Items</h3>
            <p className="text-sm text-muted">View all lost and found items</p>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-3 rounded-lg border border-base bg-surface p-6 text-center transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <HiUser className="text-3xl" />
            </div>
            <h3 className="font-semibold">View Profile</h3>
            <p className="text-sm text-muted">Manage your account settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
