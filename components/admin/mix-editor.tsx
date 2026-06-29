"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

import {
  createUploadUrlAction,
  saveMixAction,
  type MixFormState,
} from "@/app/vbm-admin/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Mix } from "@/lib/catalog/schema";
import { resolveStreamUrl } from "@/lib/drive";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Downscale an image and re-encode as JPEG so covers stay small and under the upload limit. */
async function optimiseImage(
  file: File,
  maxDim = 1280,
  quality = 0.85,
): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  let { width, height } = bitmap;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;
  const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
  return new File([blob], name, { type: "image/jpeg" });
}

export function MixEditor({ mix }: { mix?: Mix }) {
  const [state, action, pending] = useActionState<MixFormState, FormData>(
    saveMixAction,
    {},
  );

  // Auto-detect track length: load just the metadata of the stream and read its
  // duration. Runs (debounced) whenever a valid audio URL is entered.
  const [driveUrl, setDriveUrl] = React.useState(mix?.driveUrl ?? "");
  const [duration, setDuration] = React.useState<number | null>(
    mix?.durationSec ?? null,
  );
  const [detecting, setDetecting] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const probeRef = React.useRef<HTMLAudioElement | null>(null);

  // Direct-to-R2 upload (no Vercel size limit): presign on the server, PUT here.
  const [uploadPct, setUploadPct] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Cover image: downscale to JPEG in the browser before it is submitted.
  const coverRef = React.useRef<HTMLInputElement>(null);
  const [coverNote, setCoverNote] = React.useState<string | null>(null);
  const [optimising, setOptimising] = React.useState(false);

  const onCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverNote(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setCoverNote("not an image file");
      return;
    }
    setOptimising(true);
    try {
      const optimised = await optimiseImage(file);
      const transfer = new DataTransfer();
      transfer.items.add(optimised);
      if (coverRef.current) coverRef.current.files = transfer.files;
      setCoverNote(`optimised → ${Math.round(optimised.size / 1024)} KB jpg`);
    } catch {
      setCoverNote("could not process image");
    } finally {
      setOptimising(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (probeRef.current) probeRef.current.src = "";
    };
  }, []);

  const probe = (streamUrl: string) => {
    if (probeRef.current) probeRef.current.src = "";
    const audio = new Audio();
    probeRef.current = audio;
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
      }
      setDetecting(false);
    });
    audio.addEventListener("error", () => setDetecting(false));
    audio.src = streamUrl;
  };

  const onDriveUrlChange = (value: string) => {
    setDriveUrl(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    const streamUrl = resolveStreamUrl(value);
    if (!streamUrl) {
      setDuration(null);
      setDetecting(false);
      return;
    }
    setDetecting(true);
    timerRef.current = setTimeout(() => probe(streamUrl), 700);
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploadError(null);
    setUploadPct(0);

    const target = await createUploadUrlAction(file.name);
    if ("error" in target) {
      setUploadError(target.error);
      setUploadPct(null);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", target.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "audio/mpeg");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadPct(null);
        onDriveUrlChange(target.publicUrl);
      } else {
        setUploadError(`upload failed (${xhr.status})`);
        setUploadPct(null);
      }
    };
    xhr.onerror = () => {
      setUploadError("upload failed (network / CORS)");
      setUploadPct(null);
    };
    xhr.send(file);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-3 pt-6 pb-28 sm:px-4">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/vbm-admin"
          aria-label="Back to admin"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft />
        </Link>
        <div>
          <h1 className="terminal-caret font-mono text-lg font-semibold lowercase">
            {mix ? "edit mix" : "add mix"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            paste the audio url (r2 or Google Drive) and describe the set.
          </p>
        </div>
      </header>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" defaultValue={mix?.id ?? ""} />
        <input type="hidden" name="durationSec" value={duration ?? ""} />

        <Field label="title" htmlFor="title">
          <Input id="title" name="title" defaultValue={mix?.title} required />
        </Field>

        <Field label="artist" htmlFor="artist">
          <Input id="artist" name="artist" defaultValue={mix?.artist} />
        </Field>

        <Field
          label="audio url"
          htmlFor="driveUrl"
          hint="r2 url, or a google drive share link / file id"
        >
          <Input
            id="driveUrl"
            name="driveUrl"
            value={driveUrl}
            onChange={(e) => onDriveUrlChange(e.target.value)}
            placeholder="https://drive.google.com/file/d/…/view"
            required
          />
          <p className="font-mono text-[10px] text-muted-foreground">
            {detecting
              ? "detecting length…"
              : duration
                ? `length: ${formatTime(duration)} · detected automatically`
                : "length is detected automatically from a valid url"}
          </p>

          <div className="mt-1 flex flex-col gap-1">
            <label
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit cursor-pointer font-mono lowercase",
                uploadPct !== null && "pointer-events-none opacity-60",
              )}
            >
              <Upload />
              {uploadPct !== null ? `uploading… ${uploadPct}%` : "upload a file to r2"}
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={onUpload}
                disabled={uploadPct !== null}
              />
            </label>
            {uploadError ? (
              <p className="font-mono text-[10px] text-destructive">
                {uploadError}
              </p>
            ) : (
              <p className="font-mono text-[10px] text-muted-foreground">
                large files upload straight to r2 (no size limit).
              </p>
            )}
          </div>
        </Field>

        <Field
          label="description / tracklist"
          htmlFor="description"
          hint="shown to listeners"
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={mix?.description}
            rows={12}
            placeholder={"01 · artist – track\n02 · artist – track\n…"}
            className="max-h-[50vh] resize-y font-mono text-xs leading-relaxed"
          />
        </Field>

        <Field label="tags" htmlFor="tags" hint="comma separated">
          <Input
            id="tags"
            name="tags"
            defaultValue={mix?.tags.join(", ")}
            placeholder="house, dub"
          />
        </Field>

        <Field label="release date" htmlFor="releasedAt" hint="optional">
          <Input
            id="releasedAt"
            name="releasedAt"
            type="date"
            defaultValue={mix?.releasedAt}
          />
        </Field>

        <Field
          label="cover image"
          htmlFor="cover"
          hint="auto-resized to jpg, or paste a url below"
        >
          <Input
            ref={coverRef}
            id="cover"
            name="cover"
            type="file"
            accept="image/*"
            onChange={onCoverChange}
          />
          {optimising ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              optimising image…
            </p>
          ) : coverNote ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              {coverNote}
            </p>
          ) : null}
        </Field>
        <Field label="cover url" htmlFor="coverUrl">
          <Input
            id="coverUrl"
            name="coverUrl"
            defaultValue={mix?.coverUrl}
            placeholder="https://…"
          />
        </Field>

        {state.error ? (
          <p className="font-mono text-xs text-destructive">{state.error}</p>
        ) : null}

        <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
          <Link
            href="/vbm-admin"
            className={buttonVariants({ variant: "outline" })}
          >
            cancel
          </Link>
          <Button type="submit" disabled={pending || optimising}>
            {pending ? <Spinner /> : null}
            {mix ? "save" : "add mix"}
          </Button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="lowercase">
        {label}
        {hint ? (
          <span className="ml-1 font-mono text-[10px] font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </Label>
      {children}
    </div>
  );
}
