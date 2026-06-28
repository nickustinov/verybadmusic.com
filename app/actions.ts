"use server";

import { bumpPlays } from "@/lib/catalog/store";

/** Record a single play of a mix (called when playback starts in the catalog). */
export async function recordPlayAction(id: string): Promise<void> {
  if (id) await bumpPlays(id);
}
