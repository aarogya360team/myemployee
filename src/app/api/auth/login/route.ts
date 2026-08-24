import { NextRequest } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { handleError, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/tenant";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Enter a valid email and password." }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user) {
      throw new HttpError(401, "Email or password is incorrect.");
    }
    if (!user.passwordHash) {
      throw new HttpError(401, "This account uses Google. Continue with Google.");
    }
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new HttpError(401, "Email or password is incorrect.");
    }

    const membership = await prisma.businessMembership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    await createSession(user.id, membership?.businessId ?? null);
    await writeAudit({
      userId: user.id,
      actorType: "USER",
      action: "user.logged_in",
      entityType: "User",
      entityId: user.id,
    });

    return json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    return handleError(error);
  }
}
