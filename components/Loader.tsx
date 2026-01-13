"use client";

import { cn } from "@/lib/utils";

type LoaderProps = {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "pulse" | "dots" | "ring";
  className?: string;
};

export function Loader({ size = "md", variant = "spinner", className }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "animate-spin-slow rounded-full border-4 border-transparent border-t-primary border-r-primary",
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "animate-pulse-slow rounded-full bg-primary",
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex gap-1.5", className)} role="status" aria-label="Loading">
        <div
          className={cn(
            "animate-pulse-slow rounded-full bg-primary",
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
          )}
          style={{ animationDelay: "0s" }}
        />
        <div
          className={cn(
            "animate-pulse-slow rounded-full bg-primary",
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
          )}
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className={cn(
            "animate-pulse-slow rounded-full bg-primary",
            size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
          )}
          style={{ animationDelay: "0.4s" }}
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === "ring") {
    return (
      <div className={cn("relative", sizeClasses[size], className)} role="status" aria-label="Loading">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-primary border-l-primary animate-spin-slow" style={{ animationDirection: "reverse" }} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return null;
}
