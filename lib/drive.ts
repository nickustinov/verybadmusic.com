/**
 * Google Drive coupling lives entirely in this file. Playback goes through our
 * own /api/stream/<id> route, which proxies the Drive download endpoint with
 * Range support - direct Drive links return an HTML scan interstitial for large
 * files and break seeking, so the proxy is required. Nothing else in the app
 * references Drive directly.
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

/** Same-origin streaming URL for the player to use as the <audio> src. */
export function driveStreamUrl(input: string | null | undefined): string | null {
  const id = parseDriveId(input);
  if (!id) return null;
  return `/api/stream/${id}`;
}
