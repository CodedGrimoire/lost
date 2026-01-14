"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { Item, Claim, ItemStage } from "@/types/item";
import { cn } from "@/lib/utils";
import { ItemLocationMap } from "@/components/ItemLocationMap";
import { Skeleton } from "@/components/Skeleton";
import { Loader } from "@/components/Loader";
import { ClaimModal } from "@/components/ClaimModal";
import { useAuth } from "@/app/providers/AuthProvider";
import { HiSearch, HiCheckCircle, HiLocationMarker, HiCalendar, HiCamera, HiDocumentText, HiMap, HiUser } from "react-icons/hi";
import { HiArrowLeft, HiArrowPath } from "react-icons/hi2";

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const id = params?.id as string;
  const [item, setItem] = useState<Item | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [matchingLostItems, setMatchingLostItems] = useState<Item[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimModalItemId, setClaimModalItemId] = useState<string | null>(null);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Determine item stage
  const itemStage = useMemo((): ItemStage => {
    if (!item) return "available";
    if (item.claimed) return "claimed";
    const hasPendingClaims = claims.some(c => c.status === "pending");
    if (hasPendingClaims) return "claim_pending";
    return "available";
  }, [item, claims]);

  // Check if user can claim this item
  const canClaim = useMemo(() => {
    if (!item || !user || !token) return false;
    if (item.status !== "found") return false;
    if (item.claimed) return false;
    // Check if user is the reporter
    const isReporter = item.reportedBy === user.uid || 
                      (item.reporter?.email === user.email);
    if (isReporter) return false;
    // Check if user already has a pending claim
    const hasPendingClaim = claims.some(
      c => c.claimedBy === user.uid && c.status === "pending"
    );
    return !hasPendingClaim;
  }, [item, user, token, claims]);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const data = await apiClient.get<Item>(`/api/items/${id}`);
        setItem({ ...data, _id: data._id || id });
      } catch (err) {
        // Try fallback to list endpoint if detail route missing
        try {
          const list = await apiClient.get<{ items: Item[] } | Item[]>("/api/items");
          const parsed = Array.isArray(list)
            ? list
            : Array.isArray((list as { items: Item[] }).items)
              ? (list as { items: Item[] }).items
              : [];
          const found = parsed.find((entry) => entry._id === id);
          if (found) {
            setItem(found);
            return;
          }
        } catch {
          // ignore secondary failure
        }

        const message = err instanceof Error ? err.message : "Unable to load this item.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Fetch claims if user is the finder
  useEffect(() => {
    if (!item || !user || !token || loading) return;

    const isReporter = item.reportedBy === user.uid || 
                      (item.reporter?.email === user.email);

    if (isReporter && item.status === "found") {
      setLoadingClaims(true);
      apiClient
        .get<Claim[]>(`/api/claims?itemId=${id}`, { authenticated: true })
        .then((data) => {
          setClaims(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("Error fetching claims:", err);
          setClaims([]);
        })
        .finally(() => {
          setLoadingClaims(false);
        });
    }
  }, [item, user, token, id, loading]);

  // Fetch matching lost items for found items (when user is logged in)
  useEffect(() => {
    if (!item || !token || !user || loading) return;
    if (item.status !== "found") return;

    setLoadingMatches(true);
    apiClient
      .get<Item[]>(`/api/items/${id}/matches`)
      .then((data) => {
        setMatchingLostItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching matching items:", err);
        setMatchingLostItems([]);
      })
      .finally(() => {
        setLoadingMatches(false);
      });
  }, [item, token, user, id, loading]);

  const handleClaimSuccess = () => {
    // Refresh item to get updated claim status
    if (id) {
      apiClient
        .get<Item>(`/api/items/${id}`)
        .then((data) => {
          setItem({ ...data, _id: data._id || id });
        })
        .catch(() => {
          // Try fallback
          apiClient
            .get<{ items: Item[] } | Item[]>("/api/items")
            .then((list) => {
              const parsed = Array.isArray(list)
                ? list
                : Array.isArray((list as { items: Item[] }).items)
                  ? (list as { items: Item[] }).items
                  : [];
              const found = parsed.find((entry) => entry._id === id);
              if (found) setItem(found);
            });
        });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton variant="rectangular" height={500} className="w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton variant="text" lines={3} />
            <Skeleton variant="rectangular" height={200} className="w-full rounded-xl" />
            <Skeleton variant="rectangular" height={150} className="w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20 animate-fade-in">
        <div className="flex justify-center mb-4">
          <HiSearch className="text-5xl text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">Unable to load this item</h2>
        <p className="text-muted">{error || "Item may have been removed."}</p>
        <div className="flex justify-center gap-3 pt-4">
          <Link href="/items" className="btn btn-secondary flex items-center gap-2">
            <HiArrowLeft /> Back to items
          </Link>
          <button onClick={() => router.refresh()} className="btn btn-primary flex items-center gap-2">
            <HiArrowPath /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">{item.title}</h1>
            <span
              className={cn(
                "badge text-sm flex items-center gap-1",
                item.status === "lost" ? "badge-lost" : "badge-found",
              )}
            >
              {item.status === "lost" ? <><HiSearch /> Lost</> : <><HiCheckCircle /> Found</>}
            </span>
            {/* Item Stage Badge */}
            {item.status === "found" && (
              <span
                className={cn(
                  "badge text-sm flex items-center gap-1",
                  itemStage === "claimed"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : itemStage === "claim_pending"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                )}
              >
                {itemStage === "claimed" ? (
                  <>🔵 Claimed (Resolved)</>
                ) : itemStage === "claim_pending" ? (
                  <>🟡 Claim Pending</>
                ) : (
                  <>🟢 Available</>
                )}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            {item.location && (
              <div className="flex items-center gap-2">
                <HiLocationMarker className="text-lg" />
                <span className="font-medium">{item.location}</span>
              </div>
            )}
            {item.createdAt && (
              <div className="flex items-center gap-2">
                <HiCalendar className="text-lg" />
                <span>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Left Column - Image and All Info */}
        <div className="space-y-6">
          {/* Image */}
          <div className="card overflow-hidden p-0">
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary-blue-2/10">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-2">
                    <HiCamera className="text-6xl text-muted mx-auto" />
                    <p className="text-muted font-medium">No image provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <HiDocumentText className="text-2xl" />
              <h2 className="text-xl font-bold">Description</h2>
            </div>
            <p className="text-muted leading-relaxed">
              {item.description || (
                <span className="italic text-muted">No additional details provided.</span>
              )}
            </p>
          </div>

          {/* Item Info Card */}
          <div className="card space-y-3">
            <h3 className="font-semibold">Item Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className={cn("font-semibold", item.status === "lost" ? "text-red-600" : "text-green-600")}>
                  {item.status === "lost" ? "Lost" : "Found"}
                </span>
              </div>
              {item.status === "found" && (
                <div className="flex justify-between">
                  <span className="text-muted">Claim Status</span>
                  <span
                    className={cn(
                      "font-semibold",
                      itemStage === "claimed"
                        ? "text-blue-600"
                        : itemStage === "claim_pending"
                          ? "text-yellow-600"
                          : "text-green-600"
                    )}
                  >
                    {itemStage === "claimed"
                      ? "Claimed"
                      : itemStage === "claim_pending"
                        ? "Claim Pending"
                        : "Available"}
                  </span>
                </div>
              )}
              {item.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted">Reported</span>
                  <span className="font-medium">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {item.location && (
                <div className="flex justify-between">
                  <span className="text-muted">Location</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{item.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Claim Button for Found Items */}
          {canClaim && (
            <div className="card">
              <button
                onClick={() => {
                  setClaimModalItemId(item._id);
                  setClaimModalOpen(true);
                }}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <HiUser /> This might be mine
              </button>
            </div>
          )}

          {/* Possible Owners Section - Only for Found Items when logged in */}
          {item.status === "found" && token && (
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <HiSearch className="text-2xl" />
                <h2 className="text-xl font-bold">Possible Owners</h2>
              </div>
              <p className="text-sm text-muted">
                These people reported losing similar items
              </p>

              {loadingMatches ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
                  ))}
                </div>
              ) : matchingLostItems.length === 0 ? (
                <div className="rounded-lg border border-base bg-surface p-4 text-center">
                  <p className="text-sm text-muted">No potential matches yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingLostItems.map((lostItem) => {
                    const isMyLostItem = lostItem.reportedBy === user?.uid || 
                                        (lostItem.reporter?.email === user?.email);
                    const canClaimFound = item && !item.claimed && !isMyLostItem;

                    return (
                      <div
                        key={lostItem._id}
                        className="rounded-lg border border-base bg-surface p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{lostItem.title}</h4>
                            {lostItem.location && (
                              <p className="text-sm text-muted flex items-center gap-1 mt-1">
                                <HiLocationMarker /> {lostItem.location}
                              </p>
                            )}
                            {lostItem.description && (
                              <p className="text-sm text-muted mt-1 line-clamp-2">
                                {lostItem.description}
                              </p>
                            )}
                          </div>
                          <span className="badge badge-lost flex-shrink-0">
                            Lost
                          </span>
                        </div>
                        {canClaimFound && (
                          <button
                            onClick={() => {
                              setClaimModalItemId(item._id);
                              setClaimModalOpen(true);
                            }}
                            className="btn btn-primary w-full text-sm flex items-center justify-center gap-2"
                          >
                            <HiUser /> This might be mine
                          </button>
                        )}
                        {isMyLostItem && (
                          <p className="text-xs text-muted text-center">
                            This is your lost item report
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Map */}
        <div>
          {item.location ? (
            <div className="card sticky top-24 p-0">
              <div className="px-6 pt-6 pb-3">
                <div className="flex items-center gap-2">
                  <HiMap className="text-2xl" />
                  <h2 className="text-xl font-bold">Location Map</h2>
                </div>
              </div>
              <div className="px-6 pb-6">
                <ItemLocationMap location={item.location} title={item.title} />
              </div>
            </div>
          ) : (
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <HiMap className="text-2xl" />
                <h2 className="text-xl font-bold">Location Map</h2>
              </div>
              <div className="flex h-[400px] items-center justify-center rounded-xl border border-base bg-card">
                <p className="text-muted">Location not provided</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {item && claimModalItemId && (
        <ClaimModal
          itemId={claimModalItemId}
          itemTitle={item.title}
          isOpen={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setClaimModalItemId(null);
          }}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}
