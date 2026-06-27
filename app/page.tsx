import { CatalogView } from "@/components/catalog/catalog-view";
import { SiteHeader } from "@/components/site-header";
import { readMixes } from "@/lib/catalog/store";

// Always read the catalog from Blob at request time so new mixes appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const mixes = await readMixes();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-3 pt-6 pb-28 sm:px-4">
        <CatalogView mixes={mixes} />
      </main>
    </>
  );
}
