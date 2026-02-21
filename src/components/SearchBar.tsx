"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  allTags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
}

export function SearchBar({
  query,
  onQueryChange,
  allTags,
  activeTags,
  onTagToggle,
}: SearchBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search links..."
      />
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
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
  );
}
