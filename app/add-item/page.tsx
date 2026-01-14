"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/app/providers/AuthProvider";
import { apiClient } from "@/lib/apiClient";

type ItemPayload = {
  title: string;
  description: string;
  status: "lost" | "found";
  location: string;
  imageUrl: string;
};

export default function AddItemPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [form, setForm] = useState<ItemPayload>({
    title: "",
    description: "",
    status: "lost",
    location: "",
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, router, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        reporter: {
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email || "",
        },
      };
      await apiClient.post("/api/items", payload, { authenticated: true });
      toast.success("Item reported successfully");
      router.push("/items");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to report item.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Checking authentication...</p>;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-base bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Report an item</h1>
        <p className="text-muted">Share details to help the right person find or reclaim this item.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-primary">
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block text-sm font-semibold text-primary">
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ItemPayload["status"] })
              }
              className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold text-primary">
          Description
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block text-sm font-semibold text-primary">
          Location
          <input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block text-sm font-semibold text-primary">
          Image URL
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="mt-1 w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="https://"
          />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
