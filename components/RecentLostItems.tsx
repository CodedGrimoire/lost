"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Item } from "@/types/item";
import { ItemCard, ItemCardSkeleton } from "./ItemCard";

export function RecentLostItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLost = async () => {
      try {
        const response = await apiClient.get<{ items: Item[] } | Item[]>("/api/items");
        const data = Array.isArray(response)
          ? response
          : Array.isArray((response as { items: Item[] }).items)
            ? (response as { items: Item[] }).items
            : [];
        setItems(data.filter((item) => item.status === "lost").slice(0, 3));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load lost items.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchLost();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <ItemCardSkeleton />
        <ItemCardSkeleton />
        <ItemCardSkeleton />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!items.length) {
    return <p className="text-sm text-muted">No recent lost items yet.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item._id} item={item} />
      ))}
    </div>
  );
}
