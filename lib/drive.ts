/**
 * Google Drive coupling lives entirely in this file. Audio streams DIRECTLY from
 * the Drive API (www.googleapis.com), which sends CORS headers and isn't blocked
 * by Sec-Fetch-Site, so the browser plays + seeks it with NO Vercel function or
 * bandwidth. Requires NEXT_PUBLIC_DRIVE_API_KEY (a referrer-restricted, public
 * browser key) and files shared "anyone with the link".
 *
 * There is no server proxy / fallback: if the key is missing or wrong, playback
 * fails fast rather than silently routing through (and billing) a function.
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

/** Direct Drive API streaming URL for the <audio> src (no proxy, no Vercel cost). */
export function driveStreamUrl(input: string | null | undefined): string | null {
  const id = parseDriveId(input);
  if (!id) return null;
  const key = process.env.NEXT_PUBLIC_DRIVE_API_KEY ?? "";
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${key}`;
}
