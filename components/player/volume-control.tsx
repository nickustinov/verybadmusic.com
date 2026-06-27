"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { usePlayer } from "./player-provider";

const one = (v: number | readonly number[]): number =>
  Array.isArray(v) ? v[0] : (v as number);

export function VolumeControl({ className }: { className?: string }) {
  const { state, setVolume, toggleMute } = usePlayer();
  const level = state.muted ? 0 : state.volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Volume"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
      >
        <Icon />
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto p-3">
        <div className="flex flex-col items-center gap-3">
          <Slider
            aria-label="Volume"
            orientation="vertical"
            min={0}
            max={1}
            step={0.01}
            value={[level]}
            onValueChange={(v) => setVolume(one(v))}
            className="h-28"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMute}
            aria-label={state.muted ? "Unmute" : "Mute"}
          >
            <Icon />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
