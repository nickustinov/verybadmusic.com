import { z } from "zod";

/** A single DJ mix as stored in the catalog. */
export const mixSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().default(""),
  description: z.string().default(""),
  coverUrl: z.string().default(""),
  driveUrl: z.string().min(1),
  driveId: z.string().min(1),
  durationSec: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  releasedAt: z.string().default(""),
  createdAt: z.string().min(1),
  sort: z.number().default(0),
  plays: z.number().int().nonnegative().default(0),
});
export type Mix = z.infer<typeof mixSchema>;

/** The whole catalog: one JSON document stored in Vercel Blob. */
export const catalogSchema = z.object({
  mixes: z.array(mixSchema).default([]),
  updatedAt: z.string().default(""),
});
export type Catalog = z.infer<typeof catalogSchema>;

export const EMPTY_CATALOG: Catalog = { mixes: [], updatedAt: "" };

/** Raw fields submitted by the admin add/edit form. */
export const mixInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  artist: z.string().trim().default(""),
  description: z.string().trim().default(""),
  driveUrl: z.string().trim().min(1, "Google Drive URL is required"),
  coverUrl: z.string().trim().default(""),
  tags: z.string().default(""),
  releasedAt: z.string().trim().default(""),
  durationSec: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().nonnegative().optional(),
  ),
});
export type MixInput = z.input<typeof mixInputSchema>;
export type MixInputParsed = z.infer<typeof mixInputSchema>;

/** Turn a comma-separated tag string into a clean array. */
export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
