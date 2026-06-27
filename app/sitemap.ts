import type { MetadataRoute } from "next";

import { readMixes } from "@/lib/catalog/store";
import { SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/slug";

// Read mixes at request time so newly added sets appear in the sitemap.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mixes = await readMixes();

  const mixEntries: MetadataRoute.Sitemap = mixes.map((mix) => ({
    url: `${SITE_URL}/m/${slugify(mix.title)}`,
    lastModified: mix.createdAt ? new Date(mix.createdAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...mixEntries,
  ];
}
