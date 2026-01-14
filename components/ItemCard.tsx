"use client";

import Image from "next/image";
import Link from "next/link";
import { Item } from "@/types/item";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import { HiLocationMarker, HiCalendar } from "react-icons/hi";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item._id}`}
      className="card flex flex-col gap-3 bg-surface transition-smooth hover:scale-[1.02]"
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
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "badge",
              item.status === "lost" ? "badge-lost" : "badge-found",
            )}
          >
            {item.status === "lost" ? "Lost" : "Found"}
          </span>
          {item.status === "found" && item.claimed && (
            <span className="badge bg-blue-100 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-300">
              Claimed
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted line-clamp-2">
        {item.description || "No description provided."}
      </p>
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {item.location ? (
          <span className="flex items-center gap-1">
            <HiLocationMarker /> {item.location}
          </span>
        ) : null}
        {item.createdAt ? (
          <span className="flex items-center gap-1">
            <HiCalendar />{" "}
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
    <div className="card flex flex-col gap-3 animate-fade-in">
      <Skeleton variant="rectangular" height={160} className="w-full rounded-xl" />
      <div className="flex items-start justify-between gap-2">
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>
      <Skeleton variant="text" lines={2} />
      <div className="flex gap-3">
        <Skeleton variant="rectangular" width={100} height={16} />
        <Skeleton variant="rectangular" width={80} height={16} />
      </div>
    </div>
  );
}
