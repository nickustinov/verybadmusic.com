import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  safeEqual,
  signSession,
  verifySession,
} from "./session";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

/** Validate submitted credentials against the env-configured admin account. */
export function checkCredentials(username: string, password: string): boolean {
  // Evaluate both comparisons before combining so timing does not reveal which failed.
  const userOk = safeEqual(username, requireEnv("ADMIN_USERNAME"));
  const passOk = safeEqual(password, requireEnv("ADMIN_PASSWORD"));
  return userOk && passOk;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(requireEnv("SESSION_SECRET"), token);
  return payload !== null;
}

export async function createAdminSession(): Promise<void> {
  const token = await signSession(requireEnv("SESSION_SECRET"));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
