import "server-only";

import { put } from "@vercel/blob";
import { Redis } from "@upstash/redis";

import { catalogSchema, EMPTY_CATALOG, type Catalog, type Mix } from "./schema";

/**
 * Catalog metadata lives in Upstash Redis (Vercel KV): single-digit-ms reads and
 * writes, strongly consistent, so admin edits show up instantly. Cover images
 * still go to Vercel Blob (they need a public URL). Audio never passes through
 * here - it streams from Google Drive via the /api/stream proxy (see lib/drive.ts).
 */

const CATALOG_KEY = "catalog";

let client: Redis | null | undefined;

function redis(): Redis | null {
  if (client !== undefined) return client;
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export async function readCatalog(): Promise<Catalog> {
  const db = redis();
  if (!db) return EMPTY_CATALOG;

  const data = await db.get(CATALOG_KEY);
  if (!data) return EMPTY_CATALOG;

  const parsed = catalogSchema.safeParse(data);
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
  const db = redis();
  if (!db) {
    throw new Error(
      "KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.",
    );
  }
  await db.set(CATALOG_KEY, { ...catalog, updatedAt: new Date().toISOString() });
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
