"use client";

import * as React from "react";

import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { usePlayer } from "./player-provider";

const one = (v: number | readonly number[]): number =>
  Array.isArray(v) ? v[0] : (v as number);

export function SeekBar({ className }: { className?: string }) {
  const { state, seek } = usePlayer();
  const [scrub, setScrub] = React.useState<number | null>(null);
  const [showRemaining, setShowRemaining] = React.useState(true);

  const duration = state.duration > 0 ? state.duration : 0;
  const position = scrub ?? state.currentTime;
  const max = duration || 1;

  const rightLabel = !duration
    ? "··:··"
    : showRemaining
      ? `-${formatTime(Math.max(0, duration - position))}`
      : formatTime(duration);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-10 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
        {formatTime(position)}
      </span>
      <Slider
        aria-label="Seek"
        min={0}
        max={max}
        step={1}
        value={[Math.min(position, max)]}
        onValueChange={(v) => setScrub(one(v))}
        onValueCommitted={(v) => {
          seek(one(v));
          setScrub(null);
        }}
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => setShowRemaining((v) => !v)}
        aria-label={showRemaining ? "Show total time" : "Show remaining time"}
        className="w-11 text-left font-mono text-[10px] tabular-nums text-muted-foreground hover:text-foreground"
      >
        {rightLabel}
      </button>
    </div>
  );
}
