"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useLinks } from "@/hooks/useLinks";
import { toast } from "sonner";

interface Article {
  title: string;
  content: string;
  siteName: string | null;
  excerpt: string | null;
}

function ReaderContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const { user, loading: authLoading } = useAuth();
  const { links, markRead, markUnread, toggleFavorite } = useLinks(user?.id ?? null);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const matchingLink = links.find((l) => l.url === url);

  const handleToggleFavorite = () => {
    if (!matchingLink) return;
    toggleFavorite(matchingLink.id);
    toast.success(matchingLink.favorited ? "Removed from favorites" : "Added to favorites");
  };

  const handleToggleRead = () => {
    if (!matchingLink) return;
    if (matchingLink.read) {
      markUnread(matchingLink.id);
      toast.success("Marked as unread");
    } else {
      markRead(matchingLink.id);
      toast.success("Marked as read");
    }
  };

  const handleShare = () => {
    if (!url) return;
    const shareUrl = `${window.location.origin}/read?url=${encodeURIComponent(url)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!url) {
      setError("No URL provided");
      setLoading(false);
      return;
    }

    fetch(`/api/fetch-article?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setArticle(data);
        }
      })
      .catch(() => setError("Failed to load article"))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <header className="mb-10 flex items-center justify-between">
            {user ? (
              <a
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back
              </a>
            ) : (
              <span className="text-sm font-medium text-foreground tracking-tight">Spara</span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <ThemeToggle />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Toggle theme
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </header>
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground mb-4">
              {error || "Could not parse this article."}
            </p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors"
              >
                View original page
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hostname = (() => {
    try {
      return new URL(url!).hostname;
    } catch {
      return url;
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-10 flex items-center justify-between">
          {user ? (
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back
            </a>
          ) : (
            <span className="text-sm font-medium text-foreground tracking-tight">Spara</span>
          )}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="View original"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Go to article
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleShare}
                    aria-label="Share article"
                    className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
                  {copied ? "Copied!" : "Share article"}
                </TooltipContent>
              </Tooltip>
              {matchingLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleFavorite}
                      aria-label={matchingLink.favorited ? "Unfavorite" : "Favorite"}
                      className={`inline-flex items-center justify-center size-8 rounded-md transition-colors cursor-pointer ${matchingLink.favorited ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill={matchingLink.favorited ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>
                    {matchingLink.favorited ? "Remove from favorites" : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>
              )}
              {matchingLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleRead}
                      aria-label={matchingLink.read ? "Mark as unread" : "Mark as read"}
                      className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                      {matchingLink.read ? (
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>
                    {matchingLink.read ? "Mark as unread" : "Mark as read"}
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
                  Toggle theme
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        <article>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">
              {article.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {article.siteName || hostname}
            </p>
          </div>

          <div
            className="reader-content text-[15px] leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {!authLoading && !user && (
          <footer className="mt-12 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Save and share your own favorite links.{" "}
              <a
                href="https://app.usespara.com/"
                className="text-foreground hover:text-foreground/70 underline underline-offset-2 transition-colors"
              >
                Create a free account
              </a>
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin" />
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
