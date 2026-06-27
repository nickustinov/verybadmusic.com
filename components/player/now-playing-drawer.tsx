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

import { AirplayButton } from "./airplay-button";
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
  const { current } = usePlayer();

  return (
    <Drawer>
      <DrawerTrigger className={cn("min-w-0 text-left", className)}>
        {children}
      </DrawerTrigger>
      <DrawerContent showHandle={false}>
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
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 overflow-y-auto px-6 pt-10 pb-10">
          <div className="aspect-square w-48 shrink-0 overflow-hidden rounded-md border bg-muted">
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

          <div className="w-full text-center">
            <p className="truncate font-mono text-base font-medium">
              {current?.title ?? "–"}
            </p>
            {current?.artist ? (
              <p className="truncate font-mono text-sm text-muted-foreground">
                {current.artist}
              </p>
            ) : null}
          </div>

          <SeekBar className="w-full" />

          <div className="flex items-center gap-4">
            <VolumeControl />
            <TransportControls size="icon-lg" />
            <AirplayButton />
          </div>

          {current?.description ? (
            <div className="w-full border-t pt-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                tracklist
              </p>
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
