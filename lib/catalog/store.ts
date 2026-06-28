import "server-only";

import { put } from "@vercel/blob";
import { Redis } from "@upstash/redis";

import { catalogSchema, EMPTY_CATALOG, type Catalog, type Mix } from "./schema";

/**
 * Catalog metadata lives in Upstash Redis (Vercel KV): single-digit-ms reads and
 * writes, strongly consistent, so admin edits show up instantly. Cover images
 * still go to Vercel Blob (they need a public URL). Audio never passes through
 * here - it streams directly from the Google Drive API (see lib/drive.ts).
 */

const CATALOG_KEY = "catalog";
const PLAYS_KEY = "mix:plays";

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

/** Play counts live in a Redis hash so they can be bumped atomically (HINCRBY)
 *  without rewriting the whole catalog document on every play. */
async function readPlays(): Promise<Record<string, number>> {
  const db = redis();
  if (!db) return {};
  const raw = (await db.hgetall(PLAYS_KEY)) ?? {};
  const plays: Record<string, number> = {};
  for (const [id, count] of Object.entries(raw)) plays[id] = Number(count) || 0;
  return plays;
}

/** Mixes sorted for display (lowest `sort` first, newest first on ties), with
 *  live play counts merged in from the plays hash. */
export async function readMixes(): Promise<Mix[]> {
  const [{ mixes }, plays] = await Promise.all([readCatalog(), readPlays()]);
  return mixes
    .map((m) => ({ ...m, plays: plays[m.id] ?? 0 }))
    .sort((a, b) => a.sort - b.sort || b.createdAt.localeCompare(a.createdAt));
}

/** Atomically record one play of a mix. */
export async function bumpPlays(id: string): Promise<void> {
  const db = redis();
  if (!db) return;
  await db.hincrby(PLAYS_KEY, id, 1);
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
  await redis()?.hdel(PLAYS_KEY, id);
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
