"use client";

import { useRef, useEffect } from "react";

interface SearchToggleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

export function SearchToggle({
  open,
  onOpenChange,
  query,
  onQueryChange,
}: SearchToggleProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleToggle = () => {
    if (open) {
      onOpenChange(false);
      onQueryChange("");
    } else {
      onOpenChange(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`hidden sm:block overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "sm:w-44 opacity-100" : "sm:w-0 opacity-0"
        }`}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search links..."
          className="w-44 text-sm bg-background border border-border rounded-md px-2.5 py-1 focus:outline-none focus:border-foreground text-foreground placeholder:text-muted-foreground transition-colors"
        />
      </div>
      <button
        onClick={handleToggle}
        aria-label={open ? "Close search" : "Open search"}
        className="cursor-pointer inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
