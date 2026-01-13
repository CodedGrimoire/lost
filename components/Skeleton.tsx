"use client";

import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
};

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines,
}: SkeletonProps) {
  if (variant === "text" && lines) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "skeleton h-4 rounded",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        variant === "text" && "rounded",
        className
      )}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Pre-built skeleton components
export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <Skeleton variant="rectangular" height={200} className="w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="rectangular" width="40%" height={24} />
      </div>
    </div>
  );
}

export function SkeletonItem() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton variant="rectangular" width={80} height={80} className="rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" lines={2} />
          <Skeleton variant="rectangular" width="30%" height={20} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </div>
  );
}
