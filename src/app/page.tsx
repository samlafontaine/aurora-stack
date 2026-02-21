"use client";

import { useState, useMemo } from "react";
import { useLinks } from "@/hooks/useLinks";
import { AddLinkForm } from "@/components/AddLinkForm";
import { SearchBar } from "@/components/SearchBar";
import { LinkList } from "@/components/LinkList";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { NewLink } from "@/types/link";

export default function Home() {
  const { links, addLink, deleteLink, hydrated } = useLinks();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const allTags = useMemo(() => {
    const set = new Set(links.flatMap((l) => l.tags));
    return [...set].sort();
  }, [links]);

  const filteredLinks = useMemo(() => {
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

  const isFiltering = query.trim() !== "" || activeTags.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">LinkStash</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your personal link library</p>
          </div>
          <ThemeToggle />
        </header>

        <section className="mb-8">
          <AddLinkForm onAdd={(data: NewLink) => addLink(data)} />
        </section>

        {links.length > 0 && (
          <section className="mb-6">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              allTags={allTags}
              activeTags={activeTags}
              onTagToggle={handleTagToggle}
            />
          </section>
        )}

        {hydrated && (
          <LinkList
            links={filteredLinks}
            onDelete={deleteLink}
            isFiltering={isFiltering}
          />
        )}
      </div>
    </div>
  );
}
