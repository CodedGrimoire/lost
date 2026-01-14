"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { apiClient } from "@/lib/apiClient";
import { Claim, Item } from "@/types/item";
import { Skeleton } from "@/components/Skeleton";
import { HiCheckCircle, HiX, HiClock, HiArrowLeft, HiLocationMarker } from "react-icons/hi";
import { cn } from "@/lib/utils";

type ClaimWithItem = Claim & {
  item?: Item;
};

export default function DashboardClaimsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<ClaimWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithItem | null>(null);
  const [meetupAddress, setMeetupAddress] = useState("");

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, router, token]);

  useEffect(() => {
    if (!token || !user?.email) return;

    const fetchClaims = async () => {
      try {
        // First, get all items reported by this user
        const userItems = await apiClient.get<Item[]>(
          `/api/user/items?email=${encodeURIComponent(user.email!)}`,
          { authenticated: true }
        );

        const foundItems = Array.isArray(userItems)
          ? userItems.filter((item) => item.status === "found" && item.reportedBy === user.uid)
          : [];

        // For each found item, get its claims
        const allClaims: ClaimWithItem[] = [];
        for (const item of foundItems) {
          try {
            const itemClaims = await apiClient.get<Claim[]>(
              `/api/claims?itemId=${item._id}`,
              { authenticated: true }
            );
            const claimsArray = Array.isArray(itemClaims) ? itemClaims : [];
            allClaims.push(
              ...claimsArray.map((claim) => ({
                ...claim,
                item,
              }))
            );
          } catch (err) {
            console.error(`Error fetching claims for item ${item._id}:`, err);
          }
        }

        // Sort by creation date (newest first)
        allClaims.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setClaims(allClaims);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load claims.";
        toast.error(message);
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [token, user?.email, user?.uid]);

  const handleApproveClick = (claim: ClaimWithItem) => {
    setSelectedClaim(claim);
    setMeetupAddress("");
    setApproveModalOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedClaim || !meetupAddress.trim()) {
      toast.error("Please enter a meetup address");
      return;
    }

    if (processing) return;

    setProcessing(selectedClaim._id);
    try {
      await apiClient.patch(
        `/api/claims/${selectedClaim._id}`,
        { status: "approved", meetupAddress: meetupAddress.trim() },
        { authenticated: true }
      );

      toast.success("Claim approved successfully");
      setApproveModalOpen(false);
      setSelectedClaim(null);
      setMeetupAddress("");

      // Refresh claims
      if (user?.email) {
        const userItems = await apiClient.get<Item[]>(
          `/api/user/items?email=${encodeURIComponent(user.email!)}`,
          { authenticated: true }
        );

        const foundItems = Array.isArray(userItems)
          ? userItems.filter((item) => item.status === "found" && item.reportedBy === user.uid)
          : [];

        const allClaims: ClaimWithItem[] = [];
        for (const item of foundItems) {
          try {
            const itemClaims = await apiClient.get<Claim[]>(
              `/api/claims?itemId=${item._id}`,
              { authenticated: true }
            );
            const claimsArray = Array.isArray(itemClaims) ? itemClaims : [];
            allClaims.push(
              ...claimsArray.map((claim) => ({
                ...claim,
                item,
              }))
            );
          } catch (err) {
            // ignore
          }
        }

        allClaims.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setClaims(allClaims);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update claim.";
      toast.error(message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (claimId: string) => {
    if (processing) return;

    setProcessing(claimId);
    try {
      await apiClient.patch(
        `/api/claims/${claimId}`,
        { status: "rejected" },
        { authenticated: true }
      );

      toast.success("Claim rejected successfully");

      // Refresh claims
      if (user?.email) {
        const userItems = await apiClient.get<Item[]>(
          `/api/user/items?email=${encodeURIComponent(user.email!)}`,
          { authenticated: true }
        );

        const foundItems = Array.isArray(userItems)
          ? userItems.filter((item) => item.status === "found" && item.reportedBy === user.uid)
          : [];

        const allClaims: ClaimWithItem[] = [];
        for (const item of foundItems) {
          try {
            const itemClaims = await apiClient.get<Claim[]>(
              `/api/claims?itemId=${item._id}`,
              { authenticated: true }
            );
            const claimsArray = Array.isArray(itemClaims) ? itemClaims : [];
            allClaims.push(
              ...claimsArray.map((claim) => ({
                ...claim,
                item,
              }))
            );
          } catch (err) {
            // ignore
          }
        }

        allClaims.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setClaims(allClaims);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update claim.";
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
  const resolvedClaims = claims.filter((c) => c.status !== "pending");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Claims Management</h1>
            <p className="text-muted mt-1">Review and manage claims for your found items</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-base bg-surface px-4 py-2 text-sm font-semibold transition hover:border-primary hover:shadow-md"
          >
            <HiArrowLeft /> Back to Dashboard
          </Link>
        </div>
      </div>

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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveClick(claim)}
                      disabled={processing === claim._id}
                      className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      <HiCheckCircle /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(claim._id)}
                      disabled={processing === claim._id}
                      className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                      <HiX /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Claims */}
      {resolvedClaims.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-2xl font-bold">Resolved Claims ({resolvedClaims.length})</h2>
          <div className="space-y-4">
            {resolvedClaims.map((claim) => (
              <div
                key={claim._id}
                className={cn(
                  "rounded-lg border p-4",
                  claim.status === "approved"
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"
                )}
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
                      <span
                        className={cn(
                          "badge",
                          claim.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                        )}
                      >
                        {claim.status === "approved" ? (
                          <>
                            <HiCheckCircle className="mr-1" /> Approved
                          </>
                        ) : (
                          <>
                            <HiX className="mr-1" /> Rejected
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{claim.message}</p>
                    <p className="text-xs text-muted">
                      {claim.status === "approved" ? "Approved" : "Rejected"} on{" "}
                      {new Date(claim.createdAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {claim.status === "approved" && claim.meetupAddress && (
                      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex items-start gap-2">
                          <HiLocationMarker className="mt-0.5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                              Meetup Address:
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              {claim.meetupAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-base bg-card p-6 shadow-xl">
            <button
              onClick={() => {
                setApproveModalOpen(false);
                setSelectedClaim(null);
                setMeetupAddress("");
              }}
              className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <HiX className="text-xl" />
            </button>

            <h2 className="text-2xl font-bold mb-2">Approve Claim</h2>
            <p className="text-muted mb-4">
              Please provide the meetup address where the claimer can receive{" "}
              <span className="font-semibold">{selectedClaim.itemTitle}</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Meetup Address *
                </label>
                <textarea
                  value={meetupAddress}
                  onChange={(e) => setMeetupAddress(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Enter the address where the claimer should meet you to receive the item..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApproveConfirm}
                  disabled={processing === selectedClaim._id || !meetupAddress.trim()}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {processing === selectedClaim._id ? "Approving..." : "Approve Claim"}
                </button>
                <button
                  onClick={() => {
                    setApproveModalOpen(false);
                    setSelectedClaim(null);
                    setMeetupAddress("");
                  }}
                  className="btn btn-secondary"
                  disabled={processing === selectedClaim._id}
                >
                  Cancel
                </button>
              </div>
            </div>
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
                Claims for your found items will appear here when users submit them.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
