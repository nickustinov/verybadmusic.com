"use client";

import { Headphones, Pause, Play } from "lucide-react";

import type { Mix } from "@/lib/catalog/schema";
import { formatCount, formatReleaseDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CoverArt } from "./cover-art";

export function MixCard({
  mix,
  index,
  active,
  playing,
  onPlay,
}: {
  mix: Mix;
  index: number;
  active: boolean;
  playing: boolean;
  onPlay: () => void;
}) {
  const isPlaying = active && playing;

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`${isPlaying ? "Pause" : "Play"} ${mix.title}`}
      className={cn(
        "group relative flex flex-col border bg-card text-left transition-colors hover:bg-foreground hover:text-background focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "ring-1 ring-foreground",
      )}
    >
      <div className="relative aspect-square overflow-hidden border-b">
        <CoverArt src={mix.coverUrl || undefined} />
        <span className="absolute left-1.5 top-1.5 bg-background/80 px-1 font-mono text-[10px] tabular-nums text-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-background/40 text-foreground opacity-0 transition-opacity group-hover:opacity-100",
            isPlaying && "opacity-100",
          )}
        >
          {isPlaying ? <Pause className="size-7" /> : <Play className="size-7" />}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 p-2">
        <span className="truncate text-sm font-medium">{mix.title}</span>
        <span className="truncate text-xs text-muted-foreground group-hover:text-background/70">
          {mix.artist || "–"}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] tabular-nums text-muted-foreground group-hover:text-background/60">
          {mix.durationSec ? <span>{formatTime(mix.durationSec)}</span> : null}
          {mix.releasedAt ? <span>{formatReleaseDate(mix.releasedAt)}</span> : null}
          <span className="inline-flex items-center gap-0.5">
            <Headphones className="size-2.5" />
            {formatCount(mix.plays)}
          </span>
        </span>
        {mix.tags.length > 0 ? (
          <span className="mt-0.5 flex flex-wrap gap-1">
            {mix.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="border px-1 font-mono text-[9px] lowercase text-muted-foreground group-hover:border-background/30 group-hover:text-background/70"
              >
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </div>
    </button>
  );
}
