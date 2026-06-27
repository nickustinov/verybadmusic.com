"use client";

import { Airplay } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { usePlayer } from "./player-provider";

/** Shown only when a remote target (AirPlay / Cast) is actually available. */
export function AirplayButton({ className }: { className?: string }) {
  const { airplay } = usePlayer();
  if (!airplay.available) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={airplay.show}
      aria-label="Play on a remote device"
      aria-pressed={airplay.active}
      className={cn(airplay.active && "text-primary", className)}
    >
      <Airplay />
    </Button>
  );
}
