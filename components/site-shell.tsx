import { CatalogView } from "@/components/catalog/catalog-view";
import { SiteHeader } from "@/components/site-header";
import type { Mix } from "@/lib/catalog/schema";
import { SITE_NAME } from "@/lib/site";

/** The public catalog screen, shared by `/` and the shareable `/m/<slug>` route. */
export function SiteShell({
  mixes,
  initialSlug,
  heading,
}: {
  mixes: Mix[];
  initialSlug?: string;
  heading?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-3 pt-6 pb-28 sm:px-4">
        <h1 className="sr-only">{heading ?? `${SITE_NAME} — DJ sets and mixes`}</h1>
        <CatalogView mixes={mixes} initialSlug={initialSlug} />
      </main>
    </>
  );
}
