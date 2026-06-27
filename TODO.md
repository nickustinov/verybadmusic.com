# TODO — direct Google Drive streaming via Drive API key

Goal: stream the MP3s **directly from Google to the listener's browser** so audio
uses **no Vercel bandwidth / functions** (today playback goes through the
`/api/stream` proxy, which costs Vercel bandwidth + invocations).

## Why this works (the finding)

Direct browser playback fails from Drive's *download* host
(`drive.usercontent.google.com`) because Google blocks it:
- no-cors media load → blocked by `Cross-Origin-Resource-Policy: same-site`
- CORS load → `Sec-Fetch-Site: cross-site` → **403** (and that header can't be
  removed from a browser request)

But the Drive **API** host is different and is NOT blocked. Verified with curl:
- `https://www.googleapis.com/drive/v3/files/<id>?alt=media&key=<KEY>`
- CORS preflight returns `Access-Control-Allow-Origin` (echoes the origin)
- `Access-Control-Allow-Headers: range` (seeking works)
- `Sec-Fetch-Site: cross-site` is **not** blocked
- Cost: **$0** — the Drive API is free (no billing). Limits are rate quotas
  (HTTP 429 if exceeded), plus the usual per-file ~24h download-quota lockout.

So with a public, referrer-restricted **browser API key** and files shared
"anyone with the link", the `<audio crossorigin>` element can play + seek
directly from Google.

## Tradeoffs (decide before implementing)

- The API key is exposed in the client (it's in the audio URL). It is a
  **public-class key** (like a Google Maps JS key) — must be HTTP-referrer
  restricted + Drive-API-only. Not a secret, but `Referer` is spoofable by
  non-browser clients, and abuse counts against your Drive API rate quota.
- Files must stay shared **"anyone with the link"**.
- Per-file download quota still applies (a viral file can 24h-lock — any Drive
  method has this).
- Alternative with none of these downsides: move MP3s to **Cloudflare R2**
  ($0 egress, no exposed key, full control) — bigger change (upload flow).

## Step 1 — create the API key (Google Cloud Console)

1. https://console.cloud.google.com → create/select a project (no billing needed).
2. **APIs & Services → Library** → search **"Google Drive API"** → **Enable**.
3. **APIs & Services → Credentials → + Create Credentials → API key** → copy it.
4. Edit the key (click it) and restrict:
   - **Application restrictions → Websites (HTTP referrers)**, add:
     - `https://verybadmusic.com/*`
     - `http://localhost:3000/*`
     - `https://*.vercel.app/*` (optional, for preview deploys)
   - **API restrictions → Restrict key → Google Drive API** only.
   - Save (propagation can take a few minutes).
5. Confirm each MP3 is shared **"Anyone with the link → Viewer"**.

## Step 2 — add the key as an env var

- Local: add to `.env.local`
  ```
  NEXT_PUBLIC_DRIVE_API_KEY=AIza...your-key...
  ```
- Vercel: Project → Settings → Environment Variables → add
  `NEXT_PUBLIC_DRIVE_API_KEY` (Production + Preview). Redeploy.

The `NEXT_PUBLIC_` prefix is required (the browser needs it) and is fine here —
it's a public, referrer-restricted key by design.

## Step 3 — code changes

All small. The design: `driveStreamUrl` returns the direct API URL when the key
is set, and otherwise **falls back to the existing `/api/stream` proxy** — so
nothing breaks before the key is added, and the proxy stays as a safety net.

### a) `lib/drive.ts` — `driveStreamUrl`

```ts
/** Streaming URL for the <audio> src: direct Drive API when a key is set, else the proxy. */
export function driveStreamUrl(input: string | null | undefined): string | null {
  const id = parseDriveId(input);
  if (!id) return null;
  const key = process.env.NEXT_PUBLIC_DRIVE_API_KEY;
  if (key) {
    return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${key}`;
  }
  return `/api/stream/${id}`;
}
```

(Also update the file's top doc comment to describe both paths.)

### b) `components/player/player-provider.tsx` — add `crossOrigin` to the `<audio>`

```tsx
<audio
  ref={audioRef}
  preload="metadata"
  crossOrigin="anonymous"   // <-- add: needed for CORS Drive API; harmless for the proxy
  onTimeUpdate={...}
  ...
/>
```

### c) `components/admin/mix-editor.tsx` — add `crossOrigin` to the duration probe

In `probe(streamUrl)`, after `audio.preload = "metadata";`:

```ts
audio.crossOrigin = "anonymous"; // CORS for direct Drive API metadata reads
```

### d) `.env.example` — document the var

```
# Referrer-restricted, Drive-API-only browser key. When set, audio streams
# directly from Google (no Vercel bandwidth). Public by design (like a Maps key).
# Without it, playback falls back to the /api/stream proxy.
NEXT_PUBLIC_DRIVE_API_KEY=
```

### e) `lib/drive.test.ts` — cover both paths

```ts
it("falls back to the proxy route when no API key is configured", () => {
  const prev = process.env.NEXT_PUBLIC_DRIVE_API_KEY;
  delete process.env.NEXT_PUBLIC_DRIVE_API_KEY;
  try {
    expect(driveStreamUrl(`https://drive.google.com/file/d/${ID}/view`)).toBe(
      `/api/stream/${ID}`,
    );
  } finally {
    if (prev !== undefined) process.env.NEXT_PUBLIC_DRIVE_API_KEY = prev;
  }
});

it("uses the direct Drive API url when an API key is configured", () => {
  const prev = process.env.NEXT_PUBLIC_DRIVE_API_KEY;
  process.env.NEXT_PUBLIC_DRIVE_API_KEY = "test-key";
  try {
    expect(driveStreamUrl(`https://drive.google.com/file/d/${ID}/view`)).toBe(
      `https://www.googleapis.com/drive/v3/files/${ID}?alt=media&key=test-key`,
    );
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_DRIVE_API_KEY;
    else process.env.NEXT_PUBLIC_DRIVE_API_KEY = prev;
  }
});
```

## Step 4 — keep or remove the proxy

Keep `app/api/stream/[id]/route.ts`. With the code above it's the automatic
fallback when no key is set (and a safety net if the API key path ever fails).

## Step 5 — verify

- `pnpm test` (the two driveStreamUrl tests above) + `pnpm build`.
- With the key set, open a mix: DevTools → Network should show a request to
  `www.googleapis.com/drive/v3/files/...` returning **206 audio/mpeg** (not
  `/api/stream/...`), and it should play + seek.
- Confirm the Vercel function/bandwidth for `/api/stream` drops to ~0 on plays.

## Notes / gotchas

- The Drive API returns the file's stored `Content-Type`. Normal MP3s come back
  as `audio/mpeg` and play. WAV/AIFF may come back as `octet-stream` and not
  decode — keep using MP3.
- If you see 403 from `googleapis.com`: key not propagated yet, key not
  restricted to Drive API, file not public, or referrer restriction mismatch.
- If you see 429: Drive API rate limit (high concurrency) — transient, no charge.
