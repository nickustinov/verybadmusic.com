import { SiteShell } from "@/components/site-shell";
import { readMixes } from "@/lib/catalog/store";

// Always read the catalog from KV at request time so new mixes appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const mixes = await readMixes();
  return <SiteShell mixes={mixes} />;
}
