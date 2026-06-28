"use client";

import * as React from "react";
import { Headphones, Pause, Play } from "lucide-react";

import type { Mix } from "@/lib/catalog/schema";
import { formatCount, formatReleaseDate, formatTime } from "@/lib/format";
import type { Skin } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { useSkin } from "../use-skin";
import { CoverArt } from "./cover-art";

/** Rough charcoal-brush play/pause for the cassette skin (feTurbulence edges). */
function BrushIcon({
  paused,
  className,
}: {
  paused: boolean;
  className?: string;
}) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.038"
          numOctaves="3"
          seed="6"
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="8" />
      </filter>
      {paused ? (
        <path d="M30 22 H44 V78 H30 Z M56 22 H70 V78 H56 Z" filter={`url(#${id})`} />
      ) : (
        <path d="M32 20 L82 50 L32 80 Z" filter={`url(#${id})`} />
      )}
    </svg>
  );
}

type IconType = React.ComponentType<{ className?: string }>;
const BrushPlay: IconType = (props) => <BrushIcon paused={false} {...props} />;
const BrushPause: IconType = (props) => <BrushIcon paused {...props} />;

// Per-skin play/pause overlay icon. Cassette uses a large hand-brushed glyph.
const SKIN_ICONS: Record<
  Skin,
  { Play: IconType; Pause: IconType; className: string }
> = {
  terminal: { Play, Pause, className: "size-7" },
  editorial: { Play, Pause, className: "size-8 [&]:[stroke-width:1]" },
  cassette: { Play: BrushPlay, Pause: BrushPause, className: "size-24" },
  manga: { Play, Pause, className: "size-9 fill-current" },
  winamp: { Play, Pause, className: "size-7 fill-current text-primary" },
  pacman: { Play, Pause, className: "size-16 fill-current text-primary" },
  matrix: { Play, Pause, className: "size-12 fill-current text-primary" },
  gameboy: { Play, Pause, className: "size-12 fill-current text-primary" },
};

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
  const skin = useSkin();
  const { Play: PlayIcon, Pause: PauseIcon, className: iconClass } =
    SKIN_ICONS[skin];

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`${isPlaying ? "Pause" : "Play"} ${mix.title}`}
      className={cn(
        "vbm-item vbm-card group relative flex flex-col border bg-card text-left transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "ring-1 ring-foreground",
      )}
    >
      <div className="vbm-media relative aspect-square overflow-hidden border-b">
        <CoverArt src={mix.coverUrl || undefined} />
        <span className="absolute left-1.5 top-1.5 bg-background/80 px-1 font-mono text-[10px] tabular-nums text-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "vbm-overlay absolute inset-0 flex items-center justify-center bg-background/40 text-foreground opacity-0 transition-opacity group-hover:opacity-100",
            isPlaying && "opacity-100",
          )}
        >
          {isPlaying ? (
            <PauseIcon className={iconClass} />
          ) : (
            <PlayIcon className={iconClass} />
          )}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 p-2">
        <span className="vbm-title truncate text-sm font-medium font-heading">
          {mix.title}
        </span>
        <span className="vbm-sub truncate text-xs text-muted-foreground">
          {mix.artist || "–"}
        </span>
        <span className="vbm-meta flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
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
                className="vbm-tag border px-1 font-mono text-[9px] lowercase text-muted-foreground"
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
