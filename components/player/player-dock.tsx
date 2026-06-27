"use client";

import { Disc3 } from "lucide-react";

import { cn } from "@/lib/utils";

import { AirplayButton } from "./airplay-button";
import { NowPlayingDrawer } from "./now-playing-drawer";
import { usePlayer } from "./player-provider";
import { ScrollingText } from "./scrolling-text";
import { SeekBar } from "./seek-bar";
import { TransportControls } from "./transport-controls";
import { VolumeControl } from "./volume-control";

/** Persistent bottom transport. Hidden until something is queued. */
export function PlayerDock() {
  const { current, state } = usePlayer();
  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <NowPlayingMarquee />
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-3 sm:px-4">
        <NowPlayingDrawer className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
            {current.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.coverUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Disc3
                className={cn(
                  "size-5 text-muted-foreground",
                  state.isPlaying && "animate-spin [animation-duration:4s]",
                )}
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <ScrollingText className="font-mono text-sm font-medium">
              {current.title}
            </ScrollingText>
            {current.artist ? (
              <ScrollingText className="font-mono text-xs text-muted-foreground">
                {current.artist}
              </ScrollingText>
            ) : null}
          </span>
        </NowPlayingDrawer>

        <SeekBar className="hidden w-64 shrink-0 sm:flex" />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-1">
          <TransportControls size="icon" className="size-10 sm:size-8" />
          <AirplayButton className="size-10 sm:size-8" />
          <VolumeControl className="hidden sm:inline-flex" />
        </div>
      </div>
    </div>
  );
}

/** Scrolling "now playing" line sitting just above the transport. */
function NowPlayingMarquee() {
  const { current, state } = usePlayer();
  if (!current || !state.isPlaying) return null;

  const label = `now playing – ${current.title}${current.artist ? ` / ${current.artist}` : ""}`;
  const segment = Array.from({ length: 4 })
    .map(() => label)
    .join("   ·   ");

  return (
    <div className="overflow-hidden border-b bg-muted/40">
      <div className="marquee py-0.5 font-mono text-[10px] text-muted-foreground">
        <span className="px-3">{segment}</span>
        <span className="px-3" aria-hidden>
          {segment}
        </span>
      </div>
    </div>
  );
}
