import { notFound } from "next/navigation";

import { MixEditor } from "@/components/admin/mix-editor";
import { readCatalog } from "@/lib/catalog/store";

export const dynamic = "force-dynamic";

export default async function EditMixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { mixes } = await readCatalog();
  const mix = mixes.find((m) => m.id === id);
  if (!mix) notFound();

  return <MixEditor mix={mix} />;
}
