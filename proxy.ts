import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/** Guard every /vbm-admin route except the login page itself. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/vbm-admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  const authed = secret ? (await verifySession(secret, token)) !== null : false;

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/vbm-admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/vbm-admin", "/vbm-admin/:path*"],
};
