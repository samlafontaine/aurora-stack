"use client";

import { LinkCard } from "@/components/LinkCard";
import type { Link } from "@/types/link";

interface LinkListProps {
  links: Link[];
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFiltering: boolean;
  emptyMessage?: string;
}

export function LinkList({ links, onDelete, onMarkRead, onMarkUnread, onToggleFavorite, isFiltering, emptyMessage }: LinkListProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {isFiltering
          ? "No links match your search."
          : emptyMessage ?? "No links saved yet. Add your first one above."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onDelete={onDelete}
          onMarkRead={onMarkRead}
          onMarkUnread={onMarkUnread}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
