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
