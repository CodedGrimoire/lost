"use client";

import Image from "next/image";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <div className="relative mx-auto h-52 w-52">
        <Image src="/error.gif" alt="Error" fill sizes="208px" className="object-contain" />
      </div>
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-muted">{error?.message || "Please try again."}</p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
