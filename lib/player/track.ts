import type { Mix } from "@/lib/catalog/schema";
import { resolveStreamUrl } from "@/lib/drive";
import { slugify } from "@/lib/slug";

import type { PlayerTrack } from "./store";

/** Map a stored mix to the minimal shape the player needs (incl. its stream URL). */
export function mixToTrack(mix: Mix): PlayerTrack {
  return {
    id: mix.id,
    title: mix.title,
    artist: mix.artist,
    coverUrl: mix.coverUrl,
    src: resolveStreamUrl(mix.driveUrl) ?? mix.driveUrl,
    description: mix.description,
    slug: slugify(mix.title),
  };
}
