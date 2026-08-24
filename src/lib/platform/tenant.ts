import type { MembershipRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/tenant";

/**
 * Every request that touches shop data must carry this.
 * Tools, queries, and plugins read businessId from here — never from the LLM or a client-supplied id alone.
 */
export type TenantContext = {
  userId: string;
  businessId: string;
  role: MembershipRole;
};

const businessInclude = {
  settings: true,
  hours: { orderBy: { dayOfWeek: "asc" as const } },
  employees: true,
  features: true,
};

export function tenantWhere(ctx: TenantContext) {
  return { businessId: ctx.businessId };
}

export async function resolveTenantContext(
  userId: string,
  requestedBusinessId?: string | null,
  sessionBusinessId?: string | null,
): Promise<TenantContext> {
  const businessId = requestedBusinessId || sessionBusinessId || undefined;

  if (businessId) {
    const membership = await prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!membership) {
      throw new HttpError(403, "You do not have access to this business.");
    }
    return {
      userId,
      businessId: membership.businessId,
      role: membership.role as MembershipRole,
    };
  }

  const membership = await prisma.businessMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    throw new HttpError(404, "No business found for this account.");
  }
  return {
    userId,
    businessId: membership.businessId,
    role: membership.role as MembershipRole,
  };
}

export async function loadTenantBusiness(ctx: TenantContext) {
  const business = await prisma.business.findFirst({
    where: { id: ctx.businessId },
    include: businessInclude,
  });
  if (!business) {
    throw new HttpError(404, "Business not found.");
  }
  return business;
}

export async function listAccessibleBusinesses(userId: string) {
  const memberships = await prisma.businessMembership.findMany({
    where: { userId },
    include: { business: { select: { id: true, name: true, category: true } } },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((item) => ({
    id: item.business.id,
    name: item.business.name,
    category: item.business.category,
    role: item.role as MembershipRole,
  }));
}

export function requireOwnerOrAdmin(ctx: TenantContext) {
  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    throw new HttpError(403, "You do not have permission to do that.");
  }
}
