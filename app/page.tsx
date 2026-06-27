import { JsonLd } from "@/components/json-ld";
import { SiteShell } from "@/components/site-shell";
import { readMixes } from "@/lib/catalog/store";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/slug";

// Always read the catalog from KV at request time so new mixes appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const mixes = await readMixes();

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  const catalog = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} — mixes`,
    numberOfItems: mixes.length,
    itemListElement: mixes.map((mix, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/m/${slugify(mix.title)}`,
      name: mix.title,
    })),
  };

  return (
    <>
      <JsonLd data={website} />
      <JsonLd data={catalog} />
      <SiteShell mixes={mixes} />
    </>
  );
}
