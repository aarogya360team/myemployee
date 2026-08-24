import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription, getLimit, hasFeature } from "@/lib/billing/entitlements";
import { planAllowsHire, WORKFORCE_TEMPLATES } from "@/lib/usp/workforce";
import { defaultAiEmployeeData } from "@/lib/ai-employee";
import { HttpError } from "@/lib/tenant";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({ key: z.enum(["RAHUL", "PRIYA", "AMIT", "NEHA"]) });

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const employees = await prisma.employee.findMany({
      where: { businessId: ctx.businessId, type: "AI" },
      orderBy: { createdAt: "asc" },
    });
    return json({ employees, templates: WORKFORCE_TEMPLATES });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Unknown employee." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const template = WORKFORCE_TEMPLATES.find((t) => t.key === parsed.data.key);
    if (!template) return json({ error: "Unknown employee." }, 400);

    const exists = await prisma.employee.findFirst({
      where: {
        businessId: ctx.businessId,
        type: "AI",
        OR: [{ name: template.name }, { workforceRole: template.role }],
      },
    });
    if (exists) return json({ error: `${template.name} is already on duty.` }, 409);

    const sub = await getActiveSubscription(ctx.businessId);
    const planCode = sub?.plan.code ?? "STARTER";
    if (!planAllowsHire(planCode, template)) {
      throw new HttpError(402, `${template.name} can do this. Upgrade Rahul's plan.`);
    }

    const count = await prisma.employee.count({ where: { businessId: ctx.businessId, type: "AI" } });
    const limit = await getLimit(ctx.businessId, "EMPLOYEES");
    if (count >= limit) {
      throw new HttpError(402, `${template.name} can do this. Upgrade Rahul's plan or add an extra AI employee.`);
    }
    if (count >= 1 && !(await hasFeature(ctx.businessId, "MULTI_EMPLOYEE")) && limit <= 1) {
      throw new HttpError(402, `${template.name} can do this. Upgrade Rahul's plan.`);
    }

    const created = await prisma.employee.create({
      data: {
        ...defaultAiEmployeeData(template.name, ["hi", "en", "hinglish"], "friendly"),
        businessId: ctx.businessId,
        role: template.title,
        workforceRole: template.role,
      },
    });
    return json({ employee: created }, 201);
  } catch (error) {
    return handleError(error);
  }
}
