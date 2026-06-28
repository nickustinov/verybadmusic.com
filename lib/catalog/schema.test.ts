import { describe, expect, it } from "vitest";
import {
  catalogSchema,
  mixInputSchema,
  mixSchema,
  parseTags,
} from "./schema";

const validMix = {
  id: "abc123",
  title: "Warehouse Dub",
  driveUrl: "https://drive.google.com/file/d/XYZ/view",
  driveId: "XYZ",
  createdAt: "2026-06-27T00:00:00.000Z",
};

describe("mixSchema", () => {
  it("parses a minimal mix and fills defaults", () => {
    const mix = mixSchema.parse(validMix);
    expect(mix.title).toBe("Warehouse Dub");
    expect(mix.artist).toBe("");
    expect(mix.tags).toEqual([]);
    expect(mix.sort).toBe(0);
  });

  it("rejects a mix without a title", () => {
    expect(() => mixSchema.parse({ ...validMix, title: "" })).toThrow();
  });

  it("defaults driveId to empty for direct-URL sources (e.g. R2)", () => {
    const { driveId: _driveId, ...rest } = validMix;
    void _driveId;
    expect(mixSchema.parse(rest).driveId).toBe("");
  });
});

describe("catalogSchema", () => {
  it("defaults to an empty catalog", () => {
    const catalog = catalogSchema.parse({});
    expect(catalog.mixes).toEqual([]);
  });

  it("parses a catalog with mixes", () => {
    const catalog = catalogSchema.parse({ mixes: [validMix], updatedAt: "now" });
    expect(catalog.mixes).toHaveLength(1);
  });

  it("rejects a catalog containing an invalid mix", () => {
    expect(() => catalogSchema.parse({ mixes: [{ title: "no id" }] })).toThrow();
  });
});

describe("mixInputSchema", () => {
  it("trims fields and requires title + drive url", () => {
    const parsed = mixInputSchema.parse({
      title: "  Late Transmission  ",
      driveUrl: "  https://drive.google.com/file/d/XYZ/view  ",
    });
    expect(parsed.title).toBe("Late Transmission");
    expect(parsed.driveUrl).toBe("https://drive.google.com/file/d/XYZ/view");
  });

  it("rejects empty title", () => {
    expect(() =>
      mixInputSchema.parse({ title: "   ", driveUrl: "x" }),
    ).toThrow();
  });

  it("coerces an empty duration to undefined", () => {
    const parsed = mixInputSchema.parse({
      title: "x",
      driveUrl: "y",
      durationSec: "",
    });
    expect(parsed.durationSec).toBeUndefined();
  });
});

describe("parseTags", () => {
  it("splits, trims and drops empty tags", () => {
    expect(parseTags("house, techno ,, dub ")).toEqual([
      "house",
      "techno",
      "dub",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTags("   ")).toEqual([]);
    expect(parseTags("")).toEqual([]);
  });
});
