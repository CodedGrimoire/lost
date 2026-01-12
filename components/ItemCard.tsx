"use client";

import Image from "next/image";
import Link from "next/link";
import { Item } from "@/types/item";
import { cn } from "@/lib/utils";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item._id}`}
      className="card flex flex-col gap-3 bg-surface"
      prefetch={false}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-base bg-primary-white">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            No image
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <span
          className={cn(
            "badge",
            item.status === "lost" ? "badge-lost" : "badge-found",
          )}
        >
          {item.status === "lost" ? "Lost" : "Found"}
        </span>
      </div>
      <p className="text-sm text-muted line-clamp-2">
        {item.description || "No description provided."}
      </p>
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {item.location ? <span>📍 {item.location}</span> : null}
        {item.createdAt ? (
          <span>
            🗓{" "}
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="card flex animate-pulse flex-col gap-3">
      <div className="h-40 w-full rounded-xl bg-black/5 dark:bg-white/10" />
      <div className="h-4 w-2/3 rounded bg-black/5 dark:bg-white/10" />
      <div className="h-3 w-full rounded bg-black/5 dark:bg-white/10" />
      <div className="flex gap-3">
        <div className="h-3 w-24 rounded bg-black/5 dark:bg-white/10" />
        <div className="h-3 w-16 rounded bg-black/5 dark:bg-white/10" />
      </div>
    </div>
  );
}
