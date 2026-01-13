"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import { Item } from "@/types/item";
import { cn } from "@/lib/utils";

export default function ItemsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeFilter = (searchParams.get("filter") as "lost" | "found" | null) || "all";

  useEffect(() => {
    fetch(`/api/items?filter=${activeFilter}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load items.");
        }
        return res.json();
      })
      .then((data: Item[]) => {
        setItems(data);
      })
      .catch(() => {
        setError("Failed to load items.");
        toast.error("Failed to load items.");
      })
      .finally(() => setLoading(false));
  }, [activeFilter]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  const handleFilterChange = (filter: "all" | "lost" | "found") => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    const query = params.toString();
    router.push(query ? `/items?${query}` : "/items");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Browse items</h1>
          <p className="text-muted">Search everything reported on CampusLost+Found.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "lost", "found"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold capitalize transition",
                activeFilter === filter
                  ? "bg-primary text-white shadow-sm"
                  : "border border-base bg-surface text-muted hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <ItemCardSkeleton />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="animate-fade-in rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : filteredItems.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {filteredItems.map((item, i) => (
            <div key={item._id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <ItemCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in rounded-lg border border-base bg-card p-8 text-center">
          <p className="text-muted">No items match this filter yet.</p>
        </div>
      )}
    </div>
  );
}
