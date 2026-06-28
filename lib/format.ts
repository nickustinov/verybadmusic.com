/** Format a duration in seconds as m:ss, or h:mm:ss once it passes an hour. */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";

  const whole = Math.floor(totalSeconds);
  const seconds = whole % 60;
  const minutes = Math.floor(whole / 60) % 60;
  const hours = Math.floor(whole / 3600);

  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const mm = String(minutes).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/** Format a play count compactly (e.g. 1200 -> 1.2k). */
export function formatCount(count: number): string {
  if (!Number.isFinite(count) || count < 1000) return String(Math.max(0, count | 0));
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(count)
    .toLowerCase();
}

/** Format a stored release date (YYYY-MM-DD) as "mar 2024"; pass anything else through. */
export function formatReleaseDate(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : match[1];
}

/** Format a duration as an ISO 8601 string (e.g. PT1H14M0S) for structured data. */
export function isoDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "PT0S";

  const whole = Math.floor(totalSeconds);
  const seconds = whole % 60;
  const minutes = Math.floor(whole / 60) % 60;
  const hours = Math.floor(whole / 3600);

  let out = "PT";
  if (hours) out += `${hours}H`;
  if (minutes) out += `${minutes}M`;
  if (seconds) out += `${seconds}S`;
  return out === "PT" ? "PT0S" : out;
}
