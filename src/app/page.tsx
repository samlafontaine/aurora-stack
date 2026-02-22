"use client";

import { useState, useMemo, useEffect } from "react";
import { useLinks } from "@/hooks/useLinks";
import { useAuth } from "@/hooks/useAuth";
import { AddLinkForm } from "@/components/AddLinkForm";
import { SearchToggle } from "@/components/SearchToggle";
import { LinkList } from "@/components/LinkList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginScreen } from "@/components/LoginScreen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useShareToken } from "@/hooks/useShareToken";
import type { NewLink } from "@/types/link";

export default function Home() {
  const { user, loading, sendMagicLink, signOut } = useAuth();
  const { shareToken } = useShareToken(user?.id ?? null);
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const { links, addLink, deleteLink, markRead, markUnread, toggleFavorite, hydrated } = useLinks(user?.id ?? null);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("unread");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey) return;
      if (e.key === "1") { e.preventDefault(); setActiveTab("unread"); }
      if (e.key === "2") { e.preventDefault(); setActiveTab("read"); }
      if (e.key === "3") { e.preventDefault(); setActiveTab("favorites"); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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
          <div className="flex items-center gap-0">
            {links.length > 0 && (
              <SearchToggle
                open={searchOpen}
                onOpenChange={setSearchOpen}
                query={query}
                onQueryChange={setQuery}
              />
            )}
            {shareToken && (
              <button
                onClick={handleCopyShareLink}
                aria-label="Copy share link"
                title="Copy favorites share link"
                className="cursor-pointer inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {copied ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v13M7 8l5-5 5 5M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                  </svg>
                )}
              </button>
            )}
            <ThemeToggle />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  aria-label="Sign out"
                  className="cursor-pointer inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Sign out"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll need to use your magic link to sign back in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={signOut}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <section className="mb-8">
          <div className="flex items-center justify-between">
            <AddLinkForm onAdd={(data: NewLink) => addLink(data)} />
            <p className="text-xs text-muted-foreground/50 select-none hidden sm:block">
              <kbd className="font-sans">a</kbd> to add · <kbd className="font-sans">⌘1</kbd> <kbd className="font-sans">⌘2</kbd> <kbd className="font-sans">⌘3</kbd> to switch tabs
            </p>
          </div>
        </section>

        {hydrated && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
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

              {allTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                        <line x1="11" y1="18" x2="13" y2="18" />
                      </svg>
                      Filter
                      {activeTags.length > 0 && (
                        <span className="text-foreground font-medium">{activeTags.length}</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {allTags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={activeTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

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
