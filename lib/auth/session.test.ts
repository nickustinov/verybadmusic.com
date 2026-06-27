// @vitest-environment node
import { describe, expect, it } from "vitest";
import { safeEqual, signSession, verifySession } from "./session";

const SECRET = "test-secret-please-change-0123456789";

describe("signSession / verifySession", () => {
  it("round-trips a valid admin session", async () => {
    const token = await signSession(SECRET);
    const payload = await verifySession(SECRET, token);
    expect(payload).not.toBeNull();
    expect(payload?.role).toBe("admin");
    expect(payload?.sub).toBe("admin");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(SECRET);
    expect(await verifySession("another-secret-entirely-987654321", token)).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(SECRET);
    const tampered = `${token.slice(0, -2)}xy`;
    expect(await verifySession(SECRET, tampered)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession(SECRET, { ttlSeconds: -10 });
    expect(await verifySession(SECRET, token)).toBeNull();
  });

  it("rejects empty or missing tokens", async () => {
    expect(await verifySession(SECRET, "")).toBeNull();
    expect(await verifySession(SECRET, null)).toBeNull();
    expect(await verifySession(SECRET, undefined)).toBeNull();
  });
});

describe("safeEqual", () => {
  it("is true for equal strings", () => {
    expect(safeEqual("hunter2", "hunter2")).toBe(true);
  });

  it("is false for different strings of equal length", () => {
    expect(safeEqual("hunter2", "hunter3")).toBe(false);
  });

  it("is false for different-length strings", () => {
    expect(safeEqual("short", "longervalue")).toBe(false);
  });
});
