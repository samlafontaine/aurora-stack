"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import type { Link } from "@/types/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default function SharePage({ params }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    const supabase = createClient();

    // Look up user by share token, then fetch their favorites
    supabase
      .from("profiles")
      .select("id")
      .eq("share_token", token)
      .single()
      .then(async ({ data: profile }) => {
        if (!profile) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", profile.id)
          .eq("favorited", true)
          .order("created_at", { ascending: false });

        setLinks(
          (data ?? []).map((row) => ({
            id: row.id,
            url: row.url,
            title: row.title,
            tags: row.tags ?? [],
            createdAt: new Date(row.created_at).getTime(),
            read: row.read,
            favorited: row.favorited,
          }))
        );
        setLoading(false);
      });
  }, [token]);

  const allTags = useMemo(() => {
    const set = new Set(links.flatMap((l) => l.tags));
    return [...set].sort();
  }, [links]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return links.filter((link) => {
      const matchesQuery =
        !q ||
        link.title.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q);
      const matchesTags = activeTags.every((t) => link.tags.includes(t));
      return matchesQuery && matchesTags;
    });
  }, [links, query, activeTags]);

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hostname = (url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">List not found</p>
          <p className="text-xs text-muted-foreground mt-1">This share link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Favorites</h1>
            <p className="text-sm text-muted-foreground mt-0.5">A curated reading list</p>
          </div>
          <ThemeToggle />
        </header>

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:border-foreground text-foreground placeholder:text-muted-foreground transition-colors"
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                >
                  <Badge
                    variant={activeTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer font-normal"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {query || activeTags.length > 0 ? "No links match your search." : "No favorites yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2 p-4 rounded-xl border border-border hover:border-border/60 bg-card transition-colors overflow-hidden"
              >
                <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-foreground group-hover:text-foreground/70 truncate transition-colors">
                    {link.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{hostname(link.url)}</p>
                </div>
                {link.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {link.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
