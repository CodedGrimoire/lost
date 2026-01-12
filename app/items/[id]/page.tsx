"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { Item } from "@/types/item";
import { cn } from "@/lib/utils";

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
      <div className="space-y-3">
        <div className="h-72 w-full animate-pulse rounded-2xl bg-black/5 dark:bg-white/10" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-black/5 dark:bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-black/5 dark:bg-white/10" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-black/5 dark:bg-white/10" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4 rounded-2xl border border-base bg-card p-6 text-center">
        <p className="text-lg font-semibold text-red-600">Unable to load this item.</p>
        <p className="text-muted">{error || "Item may have been removed."}</p>
        <div className="flex justify-center gap-3">
          <Link href="/items" className="btn btn-secondary">
            Back to items
          </Link>
          <button onClick={() => router.refresh()} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-base bg-primary-white">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.title} fill sizes="640px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">No image provided</div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{item.title}</h1>
            <p className="text-muted">
              {item.location ? `📍 ${item.location}` : "Location not provided"}
            </p>
            {item.createdAt ? (
              <p className="text-muted">
                🗓{" "}
                {new Date(item.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "badge",
              item.status === "lost" ? "badge-lost" : "badge-found",
            )}
          >
            {item.status === "lost" ? "Lost" : "Found"}
          </span>
        </div>
        <div className="rounded-xl border border-base bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="text-sm text-muted">
            {item.description || "No additional details provided."}
          </p>
        </div>
        <div className="rounded-xl border border-base bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">Reporter</h2>
          {item.reporter?.email || item.reporter?.name ? (
            <div className="space-y-1 text-sm text-muted">
              {item.reporter?.name ? <p>Name: {item.reporter.name}</p> : null}
              {item.reporter?.email ? <p>Email: {item.reporter.email}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-muted">Reporter information unavailable.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/items" className="btn btn-secondary">
            Back to items
          </Link>
          <Link href="/add-item" className="btn btn-primary">
            Report an item
          </Link>
        </div>
      </div>
    </div>
  );
}
