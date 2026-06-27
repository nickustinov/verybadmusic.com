"use client";

import { Pause, Play } from "lucide-react";

import type { Mix } from "@/lib/catalog/schema";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CoverArt } from "./cover-art";

export function MixRow({
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
        "group flex w-full items-center gap-3 border-b px-2 py-2 text-left transition-colors hover:bg-foreground hover:text-background focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "bg-muted",
      )}
    >
      <span className="w-6 text-center font-mono text-xs tabular-nums text-muted-foreground group-hover:text-background/70">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden border">
        <CoverArt src={mix.coverUrl || undefined} />
        <span className="absolute inset-0 flex items-center justify-center bg-background/40 text-foreground opacity-0 group-hover:opacity-100">
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{mix.title}</span>
        <span className="block truncate text-xs text-muted-foreground group-hover:text-background/70">
          {mix.artist || "–"}
          {mix.tags.length > 0 ? `  ·  ${mix.tags.join(" / ")}` : ""}
        </span>
      </span>
      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground group-hover:text-background/70">
        {mix.durationSec ? formatTime(mix.durationSec) : "··:··"}
      </span>
    </button>
  );
}
