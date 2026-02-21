"use client";

import { useState, useEffect, useCallback } from "react";
import type { Link, NewLink } from "@/types/link";

const STORAGE_KEY = "linkstash_links";

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLinks(JSON.parse(raw));
    } catch {
      // corrupted storage — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, [links, hydrated]);

  const addLink = useCallback((data: NewLink) => {
    const newLink: Link = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setLinks((prev) => [newLink, ...prev]);
  }, []);

  const deleteLink = useCallback((id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { links, addLink, deleteLink, hydrated };
}
