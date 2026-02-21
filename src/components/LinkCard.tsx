"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Link } from "@/types/link";

interface LinkCardProps {
  link: Link;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function LinkCard({ link, onDelete, onMarkRead, onMarkUnread, onToggleFavorite }: LinkCardProps) {
  const hostname = (() => {
    try {
      return new URL(link.url).hostname;
    } catch {
      return link.url;
    }
  })();

  return (
    <Card className="group flex items-start justify-between gap-4 p-4 hover:border-border/60 transition-colors rounded-xl">
      <div className="flex flex-col gap-1 min-w-0">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground hover:text-foreground/70 truncate transition-colors"
        >
          {link.title}
        </a>
        <p className="text-xs text-muted-foreground truncate">{hostname}</p>
        {link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {link.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5">
        {/* Favorite toggle */}
        <button
          onClick={() => onToggleFavorite(link.id)}
          aria-label={link.favorited ? "Unfavorite" : "Favorite"}
          className={`transition-colors ${link.favorited ? "text-amber-400 opacity-100!" : "text-muted-foreground hover:text-amber-400"}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={link.favorited ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Mark read / unread toggle */}
        <button
          onClick={() => link.read ? onMarkUnread(link.id) : onMarkRead(link.id)}
          aria-label={link.read ? "Mark as unread" : "Mark as read"}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {link.read ? (
            // Filled check circle — already read
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            // Empty circle — not yet read
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              aria-label="Delete link"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1zM3 5h10l-.8 8H3.8L3 5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path d="M1 5h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this link?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{link.title}&rdquo; will be permanently removed from your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(link.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
