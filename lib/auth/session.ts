import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Stateless admin session: a short HMAC-signed JWT stored in an httpOnly cookie.
 * Edge-compatible (used from middleware). Credentials never reach the client and
 * are only compared server-side via `safeEqual`.
 */

const ALG = "HS256";

export const SESSION_COOKIE = "vbm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function keyFrom(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSession(
  secret: string,
  opts?: { sub?: string; ttlSeconds?: number },
): Promise<string> {
  const ttl = opts?.ttlSeconds ?? SESSION_TTL_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(opts?.sub ?? "admin")
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .sign(keyFrom(secret));
}

export async function verifySession(
  secret: string,
  token: string | null | undefined,
): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keyFrom(secret), {
      algorithms: [ALG],
    });
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

/** Constant-time string comparison to avoid leaking credential length/content via timing. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let mismatch = 0;
  for (let i = 0; i < ab.length; i++) {
    mismatch |= ab[i] ^ bb[i];
  }
  return mismatch === 0;
}
