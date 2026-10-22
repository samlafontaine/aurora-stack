import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface Link {
  id: string;
  url: string;
  title: string;
  tags: string[];
  createdAt: number;
  read: boolean;
  favorited: boolean;
  image: string | null;
}

export function useLinks(userId: string | null) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
              image: row.image ?? null,
            }))
          );
        }
        setLoading(false);
      });
  }, [userId]);

  const addLink = useCallback(
    async (data: { url: string; title: string; tags: string[]; image: string | null }) => {
      if (!userId) return;
      const { data: row, error } = await supabase
        .from("links")
        .insert({
          user_id: userId,
          url: data.url,
          title: data.title,
          tags: data.tags,
          image: data.image,
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
            image: row.image ?? null,
          },
          ...prev,
        ]);
      }
    },
    [userId]
  );

  const deleteLink = useCallback(async (id: string) => {
    await supabase.from("links").delete().eq("id", id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

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
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, favorited: next } : l)));
    },
    [links]
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

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
          image: row.image ?? null,
        }))
      );
    }
  }, [userId]);

  return { links, loading, addLink, deleteLink, markRead, markUnread, toggleFavorite, refresh };
}
