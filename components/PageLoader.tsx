"use client";

import { Loader } from "./Loader";

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader size="lg" variant="ring" />
      <p className="text-sm text-muted animate-pulse-slow">{message}</p>
    </div>
  );
}
