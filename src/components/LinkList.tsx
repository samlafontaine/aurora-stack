"use client";

import { LinkCard } from "@/components/LinkCard";
import type { Link } from "@/types/link";

interface LinkListProps {
  links: Link[];
  onDelete: (id: string) => void;
  isFiltering: boolean;
}

export function LinkList({ links, onDelete, isFiltering }: LinkListProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--muted)] text-sm">
        {isFiltering
          ? "No links match your search."
          : "No links saved yet. Add your first one above."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={onDelete} />
      ))}
    </div>
  );
}
