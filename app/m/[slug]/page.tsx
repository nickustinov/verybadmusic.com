import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { SiteShell } from "@/components/site-shell";
import type { Mix } from "@/lib/catalog/schema";
import { readMixes } from "@/lib/catalog/store";
import { isoDuration } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";
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

  const title = mix.artist ? `${mix.title} — ${mix.artist}` : mix.title;
  const description =
    mix.description?.trim().slice(0, 200) ||
    `Stream ${mix.title}${mix.artist ? ` by ${mix.artist}` : ""} on ${SITE_NAME}.`;
  const canonical = `/m/${slugify(mix.title)}`;
  const images = mix.coverUrl ? [{ url: mix.coverUrl }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: mix.coverUrl ? [mix.coverUrl] : undefined,
    },
  };
}

function musicRecordingLd(mix: Mix) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: mix.title,
    url: `${SITE_URL}/m/${slugify(mix.title)}`,
    ...(mix.artist
      ? { byArtist: { "@type": "MusicGroup", name: mix.artist } }
      : {}),
    ...(mix.coverUrl ? { image: mix.coverUrl } : {}),
    ...(mix.durationSec ? { duration: isoDuration(mix.durationSec) } : {}),
    ...(mix.releasedAt ? { datePublished: mix.releasedAt } : {}),
    ...(mix.tags.length ? { genre: mix.tags } : {}),
    ...(mix.description ? { description: mix.description.slice(0, 500) } : {}),
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
  const { mixes, mix } = await findMix(slug);

  return (
    <>
      {mix ? <JsonLd data={musicRecordingLd(mix)} /> : null}
      <SiteShell mixes={mixes} initialSlug={slug} heading={mix?.title} />
    </>
  );
}
