import "server-only";

import { head, put } from "@vercel/blob";

import { catalogSchema, EMPTY_CATALOG, type Catalog, type Mix } from "./schema";

/**
 * The whole catalog is a single public JSON document in Vercel Blob. Reads go
 * straight to the blob each request (uncached) so the public list and the admin
 * always agree and edits show up immediately. For this low-traffic, admin-driven
 * site that is a single cheap lookup per visit; a tag cache can be layered on
 * later if needed. Audio never passes through here - it streams from Drive.
 */

const CATALOG_PATH = "catalog.json";

async function catalogUrl(): Promise<string | null> {
  try {
    return (await head(CATALOG_PATH)).url;
  } catch {
    // Blob does not exist yet (fresh deploy) or no token configured locally.
    return null;
  }
}

export async function readCatalog(): Promise<Catalog> {
  const url = await catalogUrl();
  if (!url) return EMPTY_CATALOG;

  // Cache-bust the public CDN URL so an overwrite is read back immediately
  // (read-your-writes) instead of serving a stale edge copy for a few seconds.
  const fresh = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
  const res = await fetch(fresh, { cache: "no-store" });
  if (!res.ok) return EMPTY_CATALOG;

  const parsed = catalogSchema.safeParse(await res.json());
  return parsed.success ? parsed.data : EMPTY_CATALOG;
}

/** Mixes sorted for display (lowest `sort` first, newest first on ties). */
export async function readMixes(): Promise<Mix[]> {
  const { mixes } = await readCatalog();
  return [...mixes].sort(
    (a, b) => a.sort - b.sort || b.createdAt.localeCompare(a.createdAt),
  );
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  const next: Catalog = { ...catalog, updatedAt: new Date().toISOString() };
  await put(CATALOG_PATH, JSON.stringify(next), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export async function removeMix(id: string): Promise<void> {
  const catalog = await readCatalog();
  await writeCatalog({
    ...catalog,
    mixes: catalog.mixes.filter((m) => m.id !== id),
  });
}

/** Persist a new display order from a list of mix ids (top to bottom). */
export async function setMixOrder(orderedIds: string[]): Promise<void> {
  const catalog = await readCatalog();
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  const mixes = catalog.mixes.map((m) => ({
    ...m,
    sort: rank.get(m.id) ?? m.sort,
  }));
  await writeCatalog({ ...catalog, mixes });
}

export async function uploadCover(id: string, file: File): Promise<string> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const blob = await put(`covers/${id}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
