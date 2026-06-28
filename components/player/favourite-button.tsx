"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { toggleFavourite, useFavourites } from "../use-favourites";

type Size = "icon-sm" | "icon" | "icon-lg";

/** Heart toggle for the current track; red + filled when favourited. */
export function FavouriteButton({
  id,
  size = "icon",
  className,
}: {
  id: string;
  size?: Size;
  className?: string;
}) {
  const favs = useFavourites();
  const fav = favs.has(id);

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={fav ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={fav}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavourite(id);
      }}
    >
      <Heart className={cn(fav && "fill-red-500 text-red-500")} />
    </Button>
  );
}
