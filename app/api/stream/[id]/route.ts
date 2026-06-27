import { parseDriveId } from "@/lib/drive";

/**
 * Streams a Google Drive audio file through our origin so the browser gets real
 * audio (not Drive's HTML "virus scan" interstitial), with Range support for
 * seeking. This is the proxy fallback to direct Drive links: audio now flows
 * through the function, but seeking and large files work reliably.
 */

export const runtime = "edge";

const DOWNLOAD = "https://drive.usercontent.google.com/download";

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
    "content-type",
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

  // Guard against a stray HTML response leaking through as "audio".
  const ct = headers.get("content-type") ?? "";
  if (!ct || ct.includes("text/html")) headers.set("content-type", "audio/mpeg");

  headers.set("cache-control", "public, max-age=3600");

  return new Response(upstream.body, { status: upstream.status, headers });
}
