"use client";

import { useState, useRef, useEffect } from "react";
import { TagInput } from "@/components/TagInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { NewLink } from "@/types/link";

interface AddLinkFormProps {
  onAdd: (data: NewLink) => void;
}

export function AddLinkForm({ onAdd }: AddLinkFormProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);
  const [fetchedImage, setFetchedImage] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const lastFetchedUrl = useRef<string>("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "a" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const reset = () => {
    setUrl("");
    setTags([]);
    setUrlError(null);
    setFetchedTitle(null);
    setFetchedImage(null);
    setIsFetching(false);
    lastFetchedUrl.current = "";
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "https://" + trimmed;
    }
    return trimmed;
  };

  const fetchTitle = async (rawUrl: string) => {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized || lastFetchedUrl.current === normalized) return;

    try {
      new URL(normalized);
    } catch {
      return; // not a valid URL yet, skip silently
    }

    lastFetchedUrl.current = normalized;
    setIsFetching(true);
    setFetchedTitle(null);
    setFetchedImage(null);

    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(normalized)}`);
      const data = await res.json();
      setFetchedTitle(data.title || new URL(normalized).hostname);
      setFetchedImage(data.image || null);
    } catch {
      setFetchedTitle(new URL(normalized).hostname);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = normalizeUrl(url);

    try {
      new URL(normalizedUrl);
    } catch {
      setUrlError("Please enter a valid URL.");
      return;
    }

    const resolvedTitle = fetchedTitle || new URL(normalizedUrl).hostname;
    onAdd({ url: normalizedUrl, title: resolvedTitle, tags, image: fetchedImage });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground px-3 py-2 gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Add link
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a link</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              onBlur={(e) => fetchTitle(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                setTimeout(() => fetchTitle(pasted), 0);
              }}
              placeholder="https://..."
              autoFocus
              className="truncate"
            />
            {urlError && <p className="text-destructive text-xs pl-1">{urlError}</p>}

            {(isFetching || fetchedTitle) && (
              <p className="text-xs text-muted-foreground pl-1 break-all">
                {isFetching ? "Fetching title…" : `Title: ${fetchedTitle}`}
              </p>
            )}
          </div>

          <TagInput tags={tags} onChange={setTags} />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" variant="outline" size="sm" disabled={isFetching}>
              Save link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
