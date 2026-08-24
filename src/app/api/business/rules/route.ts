import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const RULE_TYPES = [
  "DISCOUNT",
  "CREDIT",
  "PAYMENT",
  "DELIVERY",
  "RETURN",
  "ESCALATION",
  "HOURS",
  "LANGUAGE",
  "TONE",
  "PHRASE",
] as const;

const patchSchema = z.object({
  id: z.string(),
  condition: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional(),
  action: z.enum(["ALLOW", "ESCALATE", "DENY"]).optional(),
});

const createSchema = z.object({
  ruleType: z.enum(RULE_TYPES),
  condition: z.record(z.string(), z.unknown()),
  action: z.enum(["ALLOW", "ESCALATE", "DENY"]).default("ALLOW"),
  approvalRequired: z.boolean().optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).max(999).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid rule." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const existing = await prisma.businessRule.findFirst({
      where: { businessId: ctx.businessId, ruleType: parsed.data.ruleType },
    });
    if (existing) {
      const updated = await prisma.businessRule.update({
        where: { id: existing.id },
        data: {
          condition: JSON.stringify(parsed.data.condition),
          action: parsed.data.action,
          approvalRequired: parsed.data.approvalRequired ?? existing.approvalRequired,
          enabled: parsed.data.enabled ?? existing.enabled,
          priority: parsed.data.priority ?? existing.priority,
        },
      });
      return json({ rule: updated });
    }
    const created = await prisma.businessRule.create({
      data: {
        businessId: ctx.businessId,
        ruleType: parsed.data.ruleType,
        priority: parsed.data.priority ?? 80,
        condition: JSON.stringify(parsed.data.condition),
        action: parsed.data.action,
        approvalRequired: parsed.data.approvalRequired ?? false,
        enabled: parsed.data.enabled ?? true,
      },
    });
    return json({ rule: created }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid rule." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const row = await prisma.businessRule.findFirst({
      where: { id: parsed.data.id, businessId: ctx.businessId },
    });
    if (!row) return json({ error: "Not found." }, 404);
    const updated = await prisma.businessRule.update({
      where: { id: row.id },
      data: {
        condition: JSON.stringify(parsed.data.condition),
        enabled: parsed.data.enabled ?? row.enabled,
        action: parsed.data.action ?? row.action,
      },
    });
    return json({ rule: updated });
  } catch (error) {
    return handleError(error);
  }
}
