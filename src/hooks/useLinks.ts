"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Link, NewLink } from "@/types/link";

export function useLinks(userId: string | null) {
  const [links, setLinks] = useState<Link[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const supabase = createClient();

  // Load links from Supabase on mount / when user changes
  useEffect(() => {
    if (!userId) {
      setLinks([]);
      setHydrated(true);
      return;
    }

    setHydrated(false);

    supabase
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setLinks(
            data.map((row) => ({
              id: row.id,
              url: row.url,
              title: row.title,
              tags: row.tags ?? [],
              createdAt: new Date(row.created_at).getTime(),
              read: row.read,
              favorited: row.favorited,
            }))
          );
        }
        setHydrated(true);
      });
  }, [userId]);

  const addLink = useCallback(
    async (data: NewLink) => {
      if (!userId) return;
      const { data: row, error } = await supabase
        .from("links")
        .insert({
          user_id: userId,
          url: data.url,
          title: data.title,
          tags: data.tags,
          read: false,
          favorited: false,
        })
        .select()
        .single();

      if (!error && row) {
        setLinks((prev) => [
          {
            id: row.id,
            url: row.url,
            title: row.title,
            tags: row.tags ?? [],
            createdAt: new Date(row.created_at).getTime(),
            read: row.read,
            favorited: row.favorited,
          },
          ...prev,
        ]);
      }
    },
    [userId]
  );

  const deleteLink = useCallback(
    async (id: string) => {
      await supabase.from("links").delete().eq("id", id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    },
    []
  );

  const markRead = useCallback(async (id: string) => {
    await supabase.from("links").update({ read: true }).eq("id", id);
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, read: true } : l)));
  }, []);

  const markUnread = useCallback(async (id: string) => {
    await supabase.from("links").update({ read: false }).eq("id", id);
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, read: false } : l)));
  }, []);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const link = links.find((l) => l.id === id);
      if (!link) return;
      const next = !link.favorited;
      await supabase.from("links").update({ favorited: next }).eq("id", id);
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, favorited: next } : l))
      );
    },
    [links]
  );

  return { links, addLink, deleteLink, markRead, markUnread, toggleFavorite, hydrated };
}
