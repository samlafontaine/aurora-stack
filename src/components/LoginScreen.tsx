"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LoginScreenProps {
  onSendMagicLink: (email: string) => Promise<{ error: unknown }>;
}

export function LoginScreen({ onSendMagicLink }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await onSendMagicLink(email.trim());
    setLoading(false);
    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg || "Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">LinkStash</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Your personal link library</p>
          </div>

          {sent ? (
            <div className="text-center flex flex-col gap-2">
              <p className="text-sm text-foreground font-medium">Check your inbox</p>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <span className="text-foreground">{email}</span>.<br />
                Click it to sign in — no password needed.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 mt-2 cursor-pointer transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:border-foreground text-foreground placeholder:text-muted-foreground transition-colors"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
