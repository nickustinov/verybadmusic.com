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
  it("builds a same-origin streaming url for the proxy route", () => {
    expect(driveStreamUrl(`https://drive.google.com/file/d/${ID}/view`)).toBe(
      `/api/stream/${ID}`,
    );
  });

  it("returns null when no id can be parsed", () => {
    expect(driveStreamUrl("not a drive link")).toBeNull();
  });
});
