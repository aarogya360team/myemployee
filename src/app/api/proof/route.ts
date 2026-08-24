import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { computeCaseStudyMetrics, publishCaseStudy } from "@/lib/usp/proof";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const metrics = await computeCaseStudyMetrics(ctx);
    const approvals = await prisma.caseStudyApproval.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return json({ metrics, approvals });
  } catch (error) {
    return handleError(error);
  }
}

const schema = z.object({ approve: z.boolean() });

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Say whether you approve." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const row = await publishCaseStudy(ctx, parsed.data.approve);
    return json({ approval: row });
  } catch (error) {
    return handleError(error);
  }
}
