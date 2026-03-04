"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SparaLogo } from "@/components/SparaLogo";
import { useShareToken } from "@/hooks/useShareToken";
import type { NewLink } from "@/types/link";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, signUp, signIn, signInWithGoogle, signOut } = useAuth();
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
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setQuery("");
        return;
      }
      if (!e.metaKey) return;
      if (e.key === "1") { e.preventDefault(); setActiveTab("unread"); }
      if (e.key === "2") { e.preventDefault(); setActiveTab("read"); }
      if (e.key === "3") { e.preventDefault(); setActiveTab("favorites"); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen]);

  const handleDelete = (id: string) => {
    deleteLink(id);
    toast.success("Link deleted");
  };

  const handleMarkRead = (id: string) => {
    markRead(id);
    toast.success("Marked as read");
  };

  const handleMarkUnread = (id: string) => {
    markUnread(id);
    toast.success("Marked as unread");
  };

  const handleToggleFavorite = (id: string) => {
    const link = links.find((l) => l.id === id);
    toggleFavorite(id);
    toast.success(link?.favorited ? "Removed from favorites" : "Added to favorites");
  };

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
    return <LoginScreen onSignIn={signIn} onSignUp={signUp} onGoogleSignIn={signInWithGoogle} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <SparaLogo className="h-6 w-6" />
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Spara</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Your personal link library</p>
          </div>
          <div className="flex items-center gap-0">
            <TooltipProvider>
            {links.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <SearchToggle
                      open={searchOpen}
                      onOpenChange={setSearchOpen}
                      query={query}
                      onQueryChange={setQuery}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Search
                </TooltipContent>
              </Tooltip>
            )}
            {shareToken && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyShareLink}
                      aria-label="Copy share link"
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
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>
                    {copied ? "Copied!" : "Copy favorites share link"}
                  </TooltipContent>
                </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ThemeToggle />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                Toggle theme <kbd className="ml-1.5 font-sans text-[10px] opacity-60">t</kbd>
              </TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <AlertDialogTrigger asChild>
                      <button
                        aria-label="Sign out"
                        className="cursor-pointer inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </button>
                    </AlertDialogTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Sign out
                </TooltipContent>
              </Tooltip>
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
            </TooltipProvider>
          </div>
        </header>

        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            searchOpen ? "max-h-16 opacity-100 mb-6" : "max-h-0 opacity-0"
          }`}
        >
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links..."
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 focus:outline-none focus:border-foreground text-foreground placeholder:text-muted-foreground transition-colors"
          />
        </div>

        <AddLinkForm onAdd={(data: NewLink) => { addLink(data); toast.success("Link added"); }} allTags={allTags} open={addLinkOpen} onOpenChange={setAddLinkOpen} />

        {hydrated && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TooltipProvider>
                <TabsList>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="unread">
                          Unread
                          {unread.length > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">{unread.length}</span>
                          )}
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>
                      Unread <kbd className="ml-1.5 font-sans text-[10px] opacity-60">⌘1</kbd>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="read">
                          Read
                          {read.length > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">{read.length}</span>
                          )}
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>
                      Read <kbd className="ml-1.5 font-sans text-[10px] opacity-60">⌘2</kbd>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="favorites">
                          Favorites
                          {favorites.length > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">{favorites.length}</span>
                          )}
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>
                      Favorites <kbd className="ml-1.5 font-sans text-[10px] opacity-60">⌘3</kbd>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </TooltipProvider>

              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setAddLinkOpen(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>
                      Add a link <kbd className="ml-1.5 font-sans text-[10px] opacity-60">a</kbd>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              {allTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                        <line x1="11" y1="18" x2="13" y2="18" />
                      </svg>
                      <span className="hidden sm:inline">Filter</span>
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
                        onSelect={(e) => e.preventDefault()}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              </div>
            </div>

            <TabsContent value="unread">
              <LinkList
                links={filteredUnread}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onToggleFavorite={handleToggleFavorite}
                isFiltering={isFiltering}
                emptyMessage="No unread links. Add one above or check your read list."
              />
            </TabsContent>

            <TabsContent value="read">
              <LinkList
                links={filteredRead}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onToggleFavorite={handleToggleFavorite}
                isFiltering={isFiltering}
                emptyMessage="Nothing here yet. Mark a link as read and it'll show up here."
              />
            </TabsContent>

            <TabsContent value="favorites">
              <LinkList
                links={filteredFavorites}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onToggleFavorite={handleToggleFavorite}
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
