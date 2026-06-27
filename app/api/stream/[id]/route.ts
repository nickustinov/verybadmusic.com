import { parseDriveId } from "@/lib/drive";

/**
 * Streams a Google Drive audio file through our origin. This proxy is required:
 * Google blocks direct cross-origin browser playback of its download endpoint
 * (CORP: same-site blocks no-cors loads, and a Sec-Fetch-Site: cross-site 403
 * blocks CORS loads), so the browser cannot fetch Drive audio directly. A
 * same-origin server request has none of those headers, so it works - with
 * Range support for seeking. Trade-off: audio flows through the function.
 */

export const runtime = "edge";

const DOWNLOAD = "https://drive.usercontent.google.com/download";

// Drive serves media as application/octet-stream, so we set the real audio MIME
// type from the filename. wav/mp3 play everywhere; aiff only in Safari.
const AUDIO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  wave: "audio/wav",
  aif: "audio/aiff",
  aiff: "audio/aiff",
  aifc: "audio/aiff",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
};

function audioMimeFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const ext = disposition
    .match(/filename\*?=(?:UTF-8'')?["']?[^"';]*\.([a-z0-9]+)/i)?.[1]
    ?.toLowerCase();
  return (ext && AUDIO_MIME[ext]) || null;
}

async function fetchFromDrive(id: string, range: string | null): Promise<Response> {
  const base = `${DOWNLOAD}?id=${id}&export=download`;
  const headers: HeadersInit = range ? { Range: range } : {};

  let res = await fetch(`${base}&confirm=t`, { headers, redirect: "follow" });

  // Large files may still return the confirmation page; parse its token and retry.
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    const html = await res.text();
    const confirm = html.match(/name="confirm"\s+value="([^"]+)"/)?.[1] ?? "t";
    const uuid = html.match(/name="uuid"\s+value="([^"]+)"/)?.[1];
    const retry = `${base}&confirm=${confirm}${uuid ? `&uuid=${uuid}` : ""}`;
    res = await fetch(retry, { headers, redirect: "follow" });
  }

  return res;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseDriveId(rawId) ?? rawId;
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(id)) {
    return new Response("Invalid file id", { status: 400 });
  }

  const range = req.headers.get("range");
  const upstream = await fetchFromDrive(id, range);

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  for (const name of [
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");

  // Drive sends application/octet-stream (or an HTML page on failure); resolve
  // the real audio type from the filename so browsers know how to decode it.
  const upstreamType = upstream.headers.get("content-type") ?? "";
  const fromName = audioMimeFromDisposition(
    upstream.headers.get("content-disposition"),
  );
  const isGenericOrHtml =
    !upstreamType ||
    upstreamType.includes("octet-stream") ||
    upstreamType.includes("text/html");
  headers.set(
    "content-type",
    isGenericOrHtml ? (fromName ?? "audio/mpeg") : upstreamType,
  );

  headers.set("cache-control", "public, max-age=3600");

  return new Response(upstream.body, { status: upstream.status, headers });
}
