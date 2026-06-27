"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

import { usePlayer } from "./player-provider";

type Size = "icon-sm" | "icon" | "icon-lg";

export function TransportControls({ size = "icon" }: { size?: Size }) {
  const { state, toggle, next, prev } = usePlayer();

  return (
    <ButtonGroup>
      <Button variant="outline" size={size} onClick={prev} aria-label="Previous">
        <SkipBack />
      </Button>
      <Button
        variant="outline"
        size={size}
        onClick={toggle}
        aria-label={state.isPlaying ? "Pause" : "Play"}
      >
        {state.isPlaying ? <Pause /> : <Play />}
      </Button>
      <Button variant="outline" size={size} onClick={next} aria-label="Next">
        <SkipForward />
      </Button>
    </ButtonGroup>
  );
}
