/** Canonical site metadata, reused across SEO surfaces (metadata, sitemap, JSON-LD). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verybadmusic.com"
).replace(/\/$/, "");

export const SITE_NAME = "verybadmusic";

export const SITE_DESCRIPTION =
  "Stream DJ sets and mixes on verybadmusic — long-form electronic music with tracklists, playable on any device with AirPlay support.";

export const SITE_KEYWORDS = [
  "DJ sets",
  "DJ mixes",
  "electronic music",
  "mixtape",
  "tracklist",
  "music stream",
  "house",
  "techno",
  SITE_NAME,
];
