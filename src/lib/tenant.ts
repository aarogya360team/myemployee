import { prisma } from "./prisma";
import type { MembershipRole } from "./constants";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getMembershipForUser(userId: string) {
  return prisma.businessMembership.findFirst({
    where: { userId },
    include: {
      business: {
        include: {
          settings: true,
          hours: { orderBy: { dayOfWeek: "asc" } },
          employees: true,
          features: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireMembership(userId: string) {
  const membership = await getMembershipForUser(userId);
  if (!membership) {
    throw new HttpError(404, "No business found for this account.");
  }
  return membership;
}

export async function assertBusinessAccess(userId: string, businessId: string) {
  const membership = await prisma.businessMembership.findUnique({
    where: { businessId_userId: { businessId, userId } },
  });
  if (!membership) {
    throw new HttpError(403, "You do not have access to this business.");
  }
  return membership;
}

export function requireRole(
  role: string,
  allowed: MembershipRole[],
) {
  if (!allowed.includes(role as MembershipRole)) {
    throw new HttpError(403, "You do not have permission to do that.");
  }
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
