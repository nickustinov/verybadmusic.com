import { describe, expect, it } from "vitest";
import { driveStreamUrl, parseDriveId } from "./drive";

const ID = "1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW";

describe("parseDriveId", () => {
  it("extracts the id from a /file/d/<id>/view share link", () => {
    expect(parseDriveId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(ID);
  });

  it("extracts the id from an open?id= link", () => {
    expect(parseDriveId(`https://drive.google.com/open?id=${ID}`)).toBe(ID);
  });

  it("extracts the id from a uc?export=download&id= link", () => {
    expect(parseDriveId(`https://drive.google.com/uc?export=download&id=${ID}`)).toBe(ID);
  });

  it("extracts the id from a docs.google.com/uc?id= link", () => {
    expect(parseDriveId(`https://docs.google.com/uc?id=${ID}&export=download`)).toBe(ID);
  });

  it("accepts a bare file id", () => {
    expect(parseDriveId(ID)).toBe(ID);
  });

  it("trims surrounding whitespace", () => {
    expect(parseDriveId(`  https://drive.google.com/file/d/${ID}/view  `)).toBe(ID);
  });

  it("returns null for a non-drive url", () => {
    expect(parseDriveId("https://example.com/song.mp3")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseDriveId("")).toBeNull();
    expect(parseDriveId("   ")).toBeNull();
  });

  it("does not treat a short slug as an id", () => {
    expect(parseDriveId("warehouse-dub")).toBeNull();
  });
});

describe("driveStreamUrl", () => {
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

  it("returns null when no id can be parsed", () => {
    expect(driveStreamUrl("not a drive link")).toBeNull();
  });
});
