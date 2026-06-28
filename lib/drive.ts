/**
 * Google Drive coupling lives entirely in this file.
 *
 * Preferred: stream DIRECTLY from the Drive API (www.googleapis.com), which sends
 * CORS headers and is not blocked by Sec-Fetch-Site, so the browser plays + seeks
 * it with no Vercel function/bandwidth. Requires a referrer-restricted, public
 * browser key in NEXT_PUBLIC_DRIVE_API_KEY and files shared "anyone with link".
 *
 * Fallback (no key set): the same-origin /api/stream proxy. Needed because Drive's
 * download host (drive.usercontent.google.com) blocks direct browser access
 * (CORP: same-site for no-cors; Sec-Fetch-Site: cross-site 403 for CORS), so
 * without a key a server proxy is the only way to play Drive audio.
 */

const URL_ID_PATTERNS: RegExp[] = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/<id>/view
  /[?&]id=([a-zA-Z0-9_-]+)/, // uc?...&id=<id> or open?id=<id>
  /\/d\/([a-zA-Z0-9_-]+)/, // /d/<id>
];

// Drive file ids are long random tokens. Requiring a generous minimum length
// avoids mistaking an ordinary word/slug for a bare id.
const BARE_ID = /^[a-zA-Z0-9_-]{20,}$/;

export function parseDriveId(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;

  const looksLikeUrl = value.includes("/") || value.includes("?");
  if (looksLikeUrl) {
    for (const pattern of URL_ID_PATTERNS) {
      const match = value.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  return BARE_ID.test(value) ? value : null;
}

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
