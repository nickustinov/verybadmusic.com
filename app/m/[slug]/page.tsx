import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";
import { readMixes } from "@/lib/catalog/store";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

async function findMix(slug: string) {
  const mixes = await readMixes();
  const mix = mixes.find((m) => slugify(m.title) === slug || m.id === slug);
  return { mixes, mix };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { mix } = await findMix(slug);
  if (!mix) return {};

  const description =
    mix.description?.trim().slice(0, 160) ||
    `${mix.title}${mix.artist ? ` by ${mix.artist}` : ""}`;

  return {
    title: `${mix.title} · verybadmusic`,
    description,
    openGraph: {
      title: mix.title,
      description: mix.artist || "verybadmusic",
      images: mix.coverUrl ? [{ url: mix.coverUrl }] : undefined,
    },
  };
}

export default async function MixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Render the full catalog; if the slug no longer resolves, it just shows the
  // catalog with nothing preselected (so stale shared links degrade gracefully).
  const { mixes } = await findMix(slug);
  return <SiteShell mixes={mixes} initialSlug={slug} />;
}
