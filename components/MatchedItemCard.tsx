"use client";

import Image from "next/image";
import Link from "next/link";
import { Item } from "@/types/item";
import { HiLocationMarker, HiCalendar, HiHeart } from "react-icons/hi";

export function MatchedItemCard({ item }: { item: Item & { matchedAt?: string } }) {
  return (
    <div className="card border-2 border-green-200 dark:border-green-800 flex flex-col gap-3 bg-surface transition-smooth hover:scale-[1.02]">
      <Link
        href={`/items/${item._id}`}
        className="flex flex-col gap-3"
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
          <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
            <HiHeart className="text-sm" /> Matched
          </span>
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
          {item.matchedAt ? (
            <span className="flex items-center gap-1">
              <HiCalendar />{" "}
              Reunited {new Date(item.matchedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
