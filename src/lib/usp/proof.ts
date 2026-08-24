import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/platform/tenant";
import { HttpError } from "@/lib/tenant";
import { INSUFFICIENT_DATA } from "./positioning";

export async function computeCaseStudyMetrics(ctx: TenantContext) {
  const orders = await prisma.order.findMany({ where: { businessId: ctx.businessId } });
  if (orders.length < 5) {
    return { enough: false as const, message: INSUFFICIENT_DATA, before: null, after: null };
  }
  return {
    enough: true as const,
    message: null,
    before: null,
    after: {
      orders: orders.length,
      revenuePaise: orders.reduce((s, o) => s + o.totalPaise, 0),
    },
    note: "Before/after requires an owner-set baseline. Do not invent a before picture.",
  };
}

export async function publishCaseStudy(ctx: TenantContext, approved: boolean) {
  const metrics = await computeCaseStudyMetrics(ctx);
  if (!approved) {
    return prisma.caseStudyApproval.create({
      data: {
        businessId: ctx.businessId,
        status: "DRAFT",
        published: false,
        metricsJson: JSON.stringify(metrics),
      },
    });
  }
  if (!metrics.enough) {
    throw new HttpError(409, metrics.message ?? INSUFFICIENT_DATA);
  }
  return prisma.caseStudyApproval.create({
    data: {
      businessId: ctx.businessId,
      status: "APPROVED",
      published: true,
      ownerApprovedAt: new Date(),
      metricsJson: JSON.stringify(metrics),
    },
  });
}
