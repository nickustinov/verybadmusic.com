import { describe, expect, it } from "vitest";
import { formatTime, isoDuration } from "./format";

describe("formatTime", () => {
  it("formats seconds under a minute", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(59)).toBe("0:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(72.6)).toBe("1:12");
    expect(formatTime(599)).toBe("9:59");
  });

  it("formats hours for long sets", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3661)).toBe("1:01:01");
    expect(formatTime(5294)).toBe("1:28:14");
  });

  it("guards against invalid input", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-10)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});

describe("isoDuration", () => {
  it("formats hours, minutes and seconds", () => {
    expect(isoDuration(3661)).toBe("PT1H1M1S");
    expect(isoDuration(5294)).toBe("PT1H28M14S");
  });

  it("omits empty components", () => {
    expect(isoDuration(90)).toBe("PT1M30S");
    expect(isoDuration(3600)).toBe("PT1H");
  });

  it("guards against invalid input", () => {
    expect(isoDuration(0)).toBe("PT0S");
    expect(isoDuration(-5)).toBe("PT0S");
    expect(isoDuration(Number.NaN)).toBe("PT0S");
  });
});
