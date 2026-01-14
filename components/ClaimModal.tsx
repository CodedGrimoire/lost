"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { HiX } from "react-icons/hi";

type ClaimModalProps = {
  itemId: string;
  itemTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ClaimModal({ itemId, itemTitle, isOpen, onClose, onSuccess }: ClaimModalProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Please provide a message explaining why this item is yours");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(
        "/api/claims",
        { itemId, message: message.trim() },
        { authenticated: true }
      );
      toast.success("Claim submitted! The finder will review it.");
      setMessage("");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit claim";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-base bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-black/5 dark:hover:bg-white/5"
        >
          <HiX className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Claim This Item</h2>
        <p className="text-muted mb-4">
          Provide proof that <span className="font-semibold">{itemTitle}</span> belongs to you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Proof / Description
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-base bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Describe how you can prove this item is yours (e.g., unique features, where you lost it, etc.)"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
