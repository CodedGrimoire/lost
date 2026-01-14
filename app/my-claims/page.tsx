"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import { Claim } from "@/types/item";
import { Skeleton } from "@/components/Skeleton";
import { HiCheckCircle, HiX, HiClock, HiArrowLeft, HiCheck, HiLocationMarker } from "react-icons/hi";
import { cn } from "@/lib/utils";

export default function MyClaimsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, router, token]);

  useEffect(() => {
    if (!token) return;

    const fetchClaims = async () => {
      try {
        const userClaims = await apiClient.get<Claim[]>(
          "/api/claims/my-claims",
          { authenticated: true }
        );
        setClaims(Array.isArray(userClaims) ? userClaims : []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load your claims.";
        toast.error(message);
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [token]);

  const handleMarkReceived = async (claimId: string) => {
    if (processing) return;

    if (!confirm("Have you received the item? This will remove it from the listings.")) {
      return;
    }

    setProcessing(claimId);
    try {
      await apiClient.patch(
        `/api/claims/${claimId}/received`,
        {},
        { authenticated: true }
      );

      toast.success("Item marked as received and removed from listings");

      // Refresh claims
      const userClaims = await apiClient.get<Claim[]>(
        "/api/claims/my-claims",
        { authenticated: true }
      );
      setClaims(Array.isArray(userClaims) ? userClaims : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark as received.";
      toast.error(message);
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton variant="rectangular" className="h-32 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");
  const rejectedClaims = claims.filter((c) => c.status === "rejected");
  const receivedClaims = claims.filter((c) => c.status === "received");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Claims</h1>
            <p className="text-muted mt-1">View and manage your item claims</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-base bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:shadow-md"
          >
            <HiArrowLeft /> Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Approved Claims (with meetup address) */}
      {approvedClaims.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold">Approved Claims ({approvedClaims.length})</h2>
          <div className="space-y-4">
            {approvedClaims.map((claim) => (
              <div
                key={claim._id}
                className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/items/${claim.itemId}`}
                          className="text-lg font-semibold text-primary hover:underline"
                        >
                          {claim.itemTitle}
                        </Link>
                        <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <HiCheckCircle className="mr-1" /> Approved
                        </span>
                      </div>
                      <p className="text-sm text-muted mt-1">{claim.message}</p>
                      <p className="text-xs text-muted mt-1">
                        Approved on{" "}
                        {new Date(claim.createdAt).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {claim.meetupAddress && (
                    <div className="rounded-lg border border-green-300 bg-white p-3 dark:border-green-700 dark:bg-green-950/30">
                      <div className="flex items-start gap-2">
                        <HiLocationMarker className="mt-0.5 text-green-600 dark:text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                            Meetup Address:
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            {claim.meetupAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleMarkReceived(claim._id)}
                    disabled={processing === claim._id}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <HiCheck /> Mark as Received
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold">Pending Claims ({pendingClaims.length})</h2>
          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div
                key={claim._id}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/items/${claim.itemId}`}
                        className="text-lg font-semibold text-primary hover:underline"
                      >
                        {claim.itemTitle}
                      </Link>
                      <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <HiClock className="mr-1" /> Pending
                      </span>
                    </div>
                    <p className="text-sm text-muted">{claim.message}</p>
                    <p className="text-xs text-muted">
                      Claimed on{" "}
                      {new Date(claim.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Claims */}
      {rejectedClaims.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold">Rejected Claims ({rejectedClaims.length})</h2>
          <div className="space-y-4">
            {rejectedClaims.map((claim) => (
              <div
                key={claim._id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/items/${claim.itemId}`}
                        className="text-lg font-semibold text-primary hover:underline"
                      >
                        {claim.itemTitle}
                      </Link>
                      <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
                        <HiX className="mr-1" /> Rejected
                      </span>
                    </div>
                    <p className="text-sm text-muted">{claim.message}</p>
                    <p className="text-xs text-muted">
                      Rejected on{" "}
                      {new Date(claim.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Received Claims */}
      {receivedClaims.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold">Received Items ({receivedClaims.length})</h2>
          <div className="space-y-4">
            {receivedClaims.map((claim) => (
              <div
                key={claim._id}
                className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{claim.itemTitle}</span>
                      <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <HiCheckCircle className="mr-1" /> Received
                      </span>
                    </div>
                    <p className="text-sm text-muted">{claim.message}</p>
                    <p className="text-xs text-muted">
                      Received on{" "}
                      {new Date(claim.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {claims.length === 0 && !loading && (
        <div className="card">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <HiClock className="text-6xl text-muted" />
            <div className="text-center">
              <h3 className="text-xl font-semibold">No claims yet</h3>
              <p className="text-muted mt-1">
                Claims you submit for found items will appear here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
