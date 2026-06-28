"use client";

import * as React from "react";
import { Disc3, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

import { useSkin } from "../use-skin";
import { AirplayButton } from "./airplay-button";
import { Cassette } from "./cassette";
import { FavouriteButton } from "./favourite-button";
import { usePlayer } from "./player-provider";
import { SeekBar } from "./seek-bar";
import { TransportControls } from "./transport-controls";
import { VolumeControl } from "./volume-control";

/** Wraps the dock's track-info block; tapping it opens the expanded view. */
export function NowPlayingDrawer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { current, expanded, setExpanded, state } = usePlayer();
  const skin = useSkin();
  const isCassette = skin === "cassette";

  return (
    <Drawer open={expanded} onOpenChange={setExpanded}>
      <DrawerTrigger className={cn("min-w-0 text-left", className)}>
        {children}
      </DrawerTrigger>
      <DrawerContent showHandle={false} className="overflow-hidden">
        {current?.coverUrl ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.coverUrl} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 bg-background/75" />
          </div>
        ) : null}
        <DrawerClose
          aria-label="Close"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "absolute right-3 top-3 z-10",
          )}
        >
          <X className="size-5" />
        </DrawerClose>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Now playing</DrawerTitle>
        </DrawerHeader>
        <div className="vbm-np relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-6 overflow-y-auto px-6 pt-10 pb-10">
          {isCassette ? (
            <Cassette
              playing={state.isPlaying}
              label={[current?.artist, current?.title]
                .filter(Boolean)
                .join(" – ")}
              className="w-full max-w-xs"
            />
          ) : (
            <div className="vbm-np-cover aspect-square w-48 shrink-0 overflow-hidden rounded-md border bg-muted">
              {current?.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.coverUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Disc3 className="size-12" />
                </div>
              )}
            </div>
          )}

          <div className="w-full text-center">
            {!isCassette ? (
              <p className="vbm-np-title font-heading text-3xl leading-tight font-semibold text-balance">
                {current?.title ?? "–"}
              </p>
            ) : null}
            {current?.artist ? (
              <p className="vbm-np-artist mt-1 text-base text-muted-foreground">
                {current.artist}
              </p>
            ) : null}
          </div>

          <SeekBar className="w-full" />

          <div className="flex items-center gap-4">
            <VolumeControl />
            <TransportControls size="icon-lg" />
            <AirplayButton />
            {current ? (
              <FavouriteButton id={current.id} size="icon-lg" />
            ) : null}
          </div>

          {current?.description ? (
            <div className="vbm-np-desc w-full border-t pt-4">
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                {current.description}
              </pre>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
