"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function useShareToken(userId: string | null) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("share_token")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setShareToken(data?.share_token ?? null);
        setLoading(false);
      });
  }, [userId]);

  return { shareToken, loading };
}
