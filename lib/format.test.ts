import { describe, expect, it } from "vitest";
import { formatTime } from "./format";

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
