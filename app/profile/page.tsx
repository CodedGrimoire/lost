"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { Loader } from "@/components/Loader";
import { Skeleton } from "@/components/Skeleton";
import { HiCheckCircle, HiMail, HiChartBar, HiPlus, HiSearch, HiHome } from "react-icons/hi";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, router, token]);

  if (!mounted || authLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton variant="rectangular" className="h-64 w-full" />
        <Skeleton variant="rectangular" className="h-48 w-full" />
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const email = user.email || "No email";
  const photoURL = user.photoURL;
  const initials = (user.displayName || user.email || "U")[0].toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile Header */}
      <div className="card space-y-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20 shadow-lg">
            {photoURL ? (
              <Image
                src={photoURL}
                alt={displayName}
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-primary-light to-primary-blue-2 text-4xl font-bold text-white">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-muted mt-1">{email}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <HiCheckCircle /> Verified User
              </span>
              {user.emailVerified && (
                <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  <HiMail /> Email Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="card space-y-4">
        <h2 className="text-2xl font-bold">Account Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted">Display Name</label>
            <p className="text-lg">{displayName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted">Email Address</label>
            <p className="text-lg">{email}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted">User ID</label>
            <p className="text-sm font-mono text-muted break-all">{user.uid}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted">Account Created</label>
            <p className="text-lg">
              {user.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted">Last Sign In</label>
            <p className="text-lg">
              {user.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted">Provider</label>
            <p className="text-lg">
              {user.providerData[0]?.providerId === "google.com" ? "Google" : "Email/Password"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-4 rounded-lg border border-base bg-surface p-4 transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HiChartBar className="text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold">View Dashboard</h3>
              <p className="text-sm text-muted">See your activity and statistics</p>
            </div>
          </Link>
          <Link
            href="/add-item"
            className="flex items-center gap-4 rounded-lg border border-base bg-surface p-4 transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HiPlus className="text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold">Report Item</h3>
              <p className="text-sm text-muted">Report a lost or found item</p>
            </div>
          </Link>
          <Link
            href="/items"
            className="flex items-center gap-4 rounded-lg border border-base bg-surface p-4 transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HiSearch className="text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold">Browse Items</h3>
              <p className="text-sm text-muted">View all lost and found items</p>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-4 rounded-lg border border-base bg-surface p-4 transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HiHome className="text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold">Home</h3>
              <p className="text-sm text-muted">Return to the homepage</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
