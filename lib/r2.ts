import { AwsClient } from "aws4fetch";

/**
 * Server-only R2 (S3-compatible) helpers. Generates a short-lived presigned PUT
 * URL so the browser uploads the audio file DIRECTLY to R2 — the file never
 * passes through Vercel, so there is no request-size limit. The secret stays on
 * the server; only the time-limited URL reaches the client.
 *
 * Needs R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and
 * R2_PUBLIC_BASE_URL (e.g. https://audio.verybadmusic.com).
 */

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

/** Turn a filename into a clean, URL-safe object key (keeps the extension). */
export function r2Key(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const ext = (dot > -1 ? filename.slice(dot + 1) : "mp3")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const base =
    (dot > -1 ? filename.slice(0, dot) : filename)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "mix";
  return `${base}.${ext || "mp3"}`;
}

/** Presigned PUT URL (1h) for `key`, plus the public playback URL. */
export async function createUploadUrl(
  key: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const client = new AwsClient({
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    region: "auto",
    service: "s3",
  });

  const endpoint =
    `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/` +
    `${env("R2_BUCKET")}/${encodeURIComponent(key)}?X-Amz-Expires=3600`;

  // Sign only the request (query auth); Content-Type is sent unsigned by the
  // browser and stored by R2, so the object serves as audio/mpeg.
  const signed = await client.sign(endpoint, {
    method: "PUT",
    aws: { signQuery: true },
  });

  return {
    uploadUrl: signed.url,
    publicUrl: `${env("R2_PUBLIC_BASE_URL").replace(/\/+$/, "")}/${key}`,
  };
}
