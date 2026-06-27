import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Warehouse Dub")).toBe("warehouse-dub");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("Late Transmission!! (2024)")).toBe("late-transmission-2024");
  });

  it("trims leading/trailing separators and whitespace", () => {
    expect(slugify("  spaced  out  ")).toBe("spaced-out");
  });

  it("removes diacritics", () => {
    expect(slugify("Café Münchën")).toBe("cafe-munchen");
  });

  it("falls back to 'mix' for empty/symbol-only input", () => {
    expect(slugify("")).toBe("mix");
    expect(slugify("///")).toBe("mix");
  });
});
