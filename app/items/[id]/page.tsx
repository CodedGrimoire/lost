"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { Item } from "@/types/item";
import { cn } from "@/lib/utils";
import { ItemLocationMap } from "@/components/ItemLocationMap";
import { Skeleton } from "@/components/Skeleton";
import { Loader } from "@/components/Loader";

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">Unable to load this item</h2>
        <p className="text-muted">{error || "Item may have been removed."}</p>
        <div className="flex justify-center gap-3 pt-4">
          <Link href="/items" className="btn btn-secondary">
            ← Back to items
          </Link>
          <button onClick={() => router.refresh()} className="btn btn-primary">
            🔄 Retry
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
                "badge text-sm",
                item.status === "lost" ? "badge-lost" : "badge-found",
              )}
            >
              {item.status === "lost" ? "🔍 Lost" : "✅ Found"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            {item.location && (
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span className="font-medium">{item.location}</span>
              </div>
            )}
            {item.createdAt && (
              <div className="flex items-center gap-2">
                <span className="text-lg">🗓</span>
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
                    <div className="text-6xl">📷</div>
                    <p className="text-muted font-medium">No image provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
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
        </div>

        {/* Right Column - Map */}
        <div>
          {item.location ? (
            <div className="card sticky top-24 p-0">
              <div className="px-6 pt-6 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
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
                <span className="text-2xl">🗺️</span>
                <h2 className="text-xl font-bold">Location Map</h2>
              </div>
              <div className="flex h-[400px] items-center justify-center rounded-xl border border-base bg-card">
                <p className="text-muted">Location not provided</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
