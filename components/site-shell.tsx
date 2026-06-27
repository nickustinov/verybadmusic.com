import { CatalogView } from "@/components/catalog/catalog-view";
import { SiteHeader } from "@/components/site-header";
import type { Mix } from "@/lib/catalog/schema";

/** The public catalog screen, shared by `/` and the shareable `/m/<slug>` route. */
export function SiteShell({
  mixes,
  initialSlug,
}: {
  mixes: Mix[];
  initialSlug?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-3 pt-6 pb-28 sm:px-4">
        <CatalogView mixes={mixes} initialSlug={initialSlug} />
      </main>
    </>
  );
}
