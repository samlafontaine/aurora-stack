"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const FREE_LIMIT = 20;

export function UpgradeModal({ open, onOpenChange, userId }: UpgradeModalProps) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const priceId =
      plan === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, priceId }),
    });

    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            You&apos;ve reached the free limit of {FREE_LIMIT} links. Upgrade for unlimited saves.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => setPlan("monthly")}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors cursor-pointer ${
              plan === "monthly"
                ? "border-foreground bg-accent"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <span className="font-medium">Monthly</span>
            <span className="text-muted-foreground">$4.99/mo</span>
          </button>
          <button
            onClick={() => setPlan("yearly")}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors cursor-pointer ${
              plan === "yearly"
                ? "border-foreground bg-accent"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">Yearly</span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Save 15%</span>
            </div>
            <span className="text-muted-foreground">$50.99/yr</span>
          </button>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full mt-2"
        >
          {loading ? "Redirecting…" : "Continue to checkout"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
