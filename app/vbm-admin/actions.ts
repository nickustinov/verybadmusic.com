"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

import { destroyAdminSession, isAuthenticated } from "@/lib/auth/admin";
import { mixInputSchema, parseTags, type Mix } from "@/lib/catalog/schema";
import {
  readCatalog,
  removeMix,
  setMixOrder,
  uploadCover,
  writeCatalog,
} from "@/lib/catalog/store";
import { parseDriveId } from "@/lib/drive";

async function assertAdmin() {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export type MixFormState = { error?: string };

export async function saveMixAction(
  _prev: MixFormState,
  formData: FormData,
): Promise<MixFormState> {
  await assertAdmin();

  const parsed = mixInputSchema.safeParse({
    title: formData.get("title"),
    artist: formData.get("artist"),
    description: formData.get("description"),
    driveUrl: formData.get("driveUrl"),
    coverUrl: formData.get("coverUrl"),
    tags: formData.get("tags"),
    releasedAt: formData.get("releasedAt"),
    durationSec: formData.get("durationSec"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const driveId = parseDriveId(data.driveUrl);
  if (!driveId) {
    return { error: "Could not read a Google Drive file id from that URL." };
  }

  const existingId = String(formData.get("id") ?? "");
  const id = existingId || nanoid(10);

  const catalog = await readCatalog();
  const existing = existingId
    ? catalog.mixes.find((m) => m.id === existingId)
    : undefined;

  let coverUrl = data.coverUrl || existing?.coverUrl || "";
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    coverUrl = await uploadCover(id, cover);
  }

  // New mixes go to the top of the list (lowest sort value).
  const minSort = catalog.mixes.reduce((min, m) => Math.min(min, m.sort), 0);
  const mix: Mix = {
    id,
    title: data.title,
    artist: data.artist,
    description: data.description,
    coverUrl,
    driveUrl: data.driveUrl,
    driveId,
    durationSec: data.durationSec,
    tags: parseTags(data.tags),
    releasedAt: data.releasedAt,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    sort: existing?.sort ?? minSort - 1,
  };

  // Single write from the catalog we already read (no extra round-trips).
  const mixes = existing
    ? catalog.mixes.map((m) => (m.id === mix.id ? mix : m))
    : [...catalog.mixes, mix];
  await writeCatalog({ ...catalog, mixes });

  redirect("/vbm-admin");
}

export async function deleteMixAction(id: string): Promise<void> {
  await assertAdmin();
  await removeMix(id);
  revalidatePath("/vbm-admin");
}

export async function reorderMixesAction(orderedIds: string[]): Promise<void> {
  await assertAdmin();
  await setMixOrder(orderedIds);
  revalidatePath("/vbm-admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/vbm-admin/login");
}
