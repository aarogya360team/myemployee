import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SESSION_COOKIE } from "./constants";
import { hashPassword, verifyPassword } from "./password";
import { setActiveBusinessForUser } from "./session-store";

export { hashPassword, verifyPassword, setActiveBusinessForUser };

const SESSION_DAYS = 30;

export function newSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(userId: string, activeBusinessId?: string | null) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token, userId, expiresAt, activeBusinessId: activeBusinessId ?? null },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionState() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return {
    user: session.user,
    activeBusinessId: session.activeBusinessId,
    token: session.token,
  };
}

export async function getSessionUser() {
  const session = await getSessionState();
  return session?.user ?? null;
}
