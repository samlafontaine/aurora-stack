"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useLinks } from "@/hooks/useLinks";
import { useAuth } from "@/hooks/useAuth";
import { AddLinkForm } from "@/components/AddLinkForm";
import { SearchToggle } from "@/components/SearchToggle";
import { LinkList } from "@/components/LinkList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginScreen } from "@/components/LoginScreen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NewLink } from "@/types/link";

export default function Home() {
  const { user, loading, sendMagicLink, signOut } = useAuth();
  const { links, addLink, deleteLink, markRead, markUnread, toggleFavorite, hydrated } = useLinks(user?.id ?? null);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const unread = useMemo(() => links.filter((l) => !l.read), [links]);
  const read = useMemo(() => links.filter((l) => l.read), [links]);
  const favorites = useMemo(() => links.filter((l) => l.favorited), [links]);

  const allTags = useMemo(() => {
    const set = new Set(links.flatMap((l) => l.tags));
    return [...set].sort();
  }, [links]);

  const applyFilters = (subset: typeof links) => {
    const q = query.toLowerCase().trim();
    return subset.filter((link) => {
      const matchesQuery =
        !q ||
        link.title.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q);
      const matchesTags = activeTags.every((t) => link.tags.includes(t));
      return matchesQuery && matchesTags;
    });
  };

  const filteredUnread = useMemo(() => applyFilters(unread), [unread, query, activeTags]);
  const filteredRead = useMemo(() => applyFilters(read), [read, query, activeTags]);
  const filteredFavorites = useMemo(() => applyFilters(favorites), [favorites, query, activeTags]);

  const isFiltering = query.trim() !== "" || activeTags.length > 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginScreen onSendMagicLink={sendMagicLink} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">LinkStash</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your personal link library</p>
          </div>
          <div className="flex items-center gap-1">
            {links.length > 0 && (
              <SearchToggle
                open={searchOpen}
                onOpenChange={setSearchOpen}
                query={query}
                onQueryChange={setQuery}
              />
            )}
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors ml-1"
              title="Sign out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <section className="mb-8">
          <AddLinkForm onAdd={(data: NewLink) => addLink(data)} />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
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
        </section>

        {hydrated && (
          <Tabs defaultValue="unread">
            <TabsList className="mb-4">
              <TabsTrigger value="unread">
                Unread
                {unread.length > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{unread.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">
                Read
                {read.length > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{read.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites">
                Favorites
                {favorites.length > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{favorites.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread">
              <LinkList
                links={filteredUnread}
                onDelete={deleteLink}
                onMarkRead={markRead}
                onMarkUnread={markUnread}
                onToggleFavorite={toggleFavorite}
                isFiltering={isFiltering}
                emptyMessage="No unread links. Add one above or check your read list."
              />
            </TabsContent>

            <TabsContent value="read">
              <LinkList
                links={filteredRead}
                onDelete={deleteLink}
                onMarkRead={markRead}
                onMarkUnread={markUnread}
                onToggleFavorite={toggleFavorite}
                isFiltering={isFiltering}
                emptyMessage="Nothing here yet. Mark a link as read and it'll show up here."
              />
            </TabsContent>

            <TabsContent value="favorites">
              <LinkList
                links={filteredFavorites}
                onDelete={deleteLink}
                onMarkRead={markRead}
                onMarkUnread={markUnread}
                onToggleFavorite={toggleFavorite}
                isFiltering={isFiltering}
                emptyMessage="No favorites yet. Star a link to save it here."
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
