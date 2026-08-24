import { NextRequest, NextResponse } from "next/server";
import { googleAuthorizeUrl, googleOAuthEnabled, GOOGLE_STATE_COOKIE, newOAuthState } from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  if (!googleOAuthEnabled()) {
    const url = new URL("/login", request.url);
    url.searchParams.set(
      "error",
      "Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. See Google Cloud → Credentials → Web client.",
    );
    return NextResponse.redirect(url);
  }

  const next = request.nextUrl.searchParams.get("next") || "/";
  const state = newOAuthState();
  const payload = Buffer.from(JSON.stringify({ state, next: next.startsWith("/") ? next : "/" })).toString(
    "base64url",
  );

  const response = NextResponse.redirect(googleAuthorizeUrl(payload));
  response.cookies.set(GOOGLE_STATE_COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
