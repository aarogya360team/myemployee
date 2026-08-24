import { NextRequest } from "next/server";
import { createSession, getSessionUser, hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { handleError, json } from "@/lib/http";
import { trackFunnel } from "@/lib/funnel";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/tenant";
import { signupSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Please check your name, email, and password." }, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "An account with this email already exists.");
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    await createSession(user.id);
    await writeAudit({
      userId: user.id,
      actorType: "USER",
      action: "user.signed_up",
      entityType: "User",
      entityId: user.id,
    });
    await trackFunnel({ name: "signup_started", userId: user.id });

    return json({ user: { id: user.id, email: user.email, name: user.name } }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null }, 401);
  return json({ user: { id: user.id, email: user.email, name: user.name } });
}
