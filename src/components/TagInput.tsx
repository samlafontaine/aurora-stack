"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setFocused(true);
  };

  const handleBlur = () => {
    // Small delay so clicks on suggestions register before dropdown closes
    blurTimeout.current = setTimeout(() => {
      setFocused(false);
      if (inputValue.trim()) addTag(inputValue);
    }, 150);
  };

  const handleSuggestionClick = (tag: string) => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    addTag(tag);
    setFocused(true);
  };

  const filteredSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 items-center bg-background border border-input rounded-md px-3 py-2 min-h-[40px] focus-within:ring-1 focus-within:ring-ring transition-all">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 font-normal">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-foreground transition-colors leading-none ml-0.5"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1 min-w-[80px]"
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(tag)}
              className="w-full text-left px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent cursor-pointer transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
