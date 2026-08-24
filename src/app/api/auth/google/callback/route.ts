import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  googleOAuthEnabled,
  GOOGLE_STATE_COOKIE,
} from "@/lib/auth/google";
import { writeAudit } from "@/lib/audit";
import { trackFunnel } from "@/lib/funnel";
import { prisma } from "@/lib/prisma";

function fail(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  const res = NextResponse.redirect(url);
  res.cookies.delete(GOOGLE_STATE_COOKIE);
  return res;
}

export async function GET(request: NextRequest) {
  if (!googleOAuthEnabled()) {
    return fail(request, "Google sign-in is not available.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stored = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!code || !state || !stored || state !== stored) {
    return fail(request, "Google sign-in was cancelled or expired. Try again.");
  }

  let next = "/";
  try {
    const parsed = JSON.parse(Buffer.from(stored, "base64url").toString("utf8")) as {
      next?: string;
    };
    if (parsed.next?.startsWith("/")) next = parsed.next;
  } catch {
    next = "/";
  }

  try {
    const accessToken = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(accessToken);

    const existingAccount = await prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: { provider: "google", providerAccountId: profile.googleId },
      },
    });

    let userId = existingAccount?.userId;
    let isNew = false;

    if (!userId) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (byEmail) {
        await prisma.authAccount.create({
          data: {
            userId: byEmail.id,
            provider: "google",
            providerAccountId: profile.googleId,
          },
        });
        if (!byEmail.image && profile.image) {
          await prisma.user.update({ where: { id: byEmail.id }, data: { image: profile.image } });
        }
        userId = byEmail.id;
      } else {
        const created = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            image: profile.image,
            passwordHash: null,
            accounts: {
              create: { provider: "google", providerAccountId: profile.googleId },
            },
          },
        });
        userId = created.id;
        isNew = true;
        await writeAudit({
          userId,
          actorType: "USER",
          action: "user.signed_up",
          entityType: "User",
          entityId: userId,
          metadata: { provider: "google" },
        });
        await trackFunnel({ name: "signup_started", userId }).catch(() => undefined);
      }
    }

    const membership = await prisma.businessMembership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    await createSession(userId, membership?.businessId ?? null);
    if (!isNew) {
      await writeAudit({
        userId,
        actorType: "USER",
        action: "user.logged_in",
        entityType: "User",
        entityId: userId,
        metadata: { provider: "google" },
      });
    }

    const dest = membership ? (next.startsWith("/onboard") ? "/app" : next) : "/onboard";
    const res = NextResponse.redirect(new URL(dest, request.url));
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    return res;
  } catch (error) {
    console.error(error);
    return fail(request, "Could not finish Google sign-in. Try again.");
  }
}
