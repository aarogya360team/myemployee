import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { rebuildMemory } from "@/lib/usp/memory";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({ value: z.string().trim().min(1).max(500) });

async function persistRebuiltMemory(businessId: string, customerId: string) {
  const facts = await prisma.customerMemoryFact.findMany({
    where: { businessId, customerId },
    orderBy: { createdAt: "asc" },
  });
  await prisma.customer.update({
    where: { id: customerId },
    data: { memoryJson: JSON.stringify(rebuildMemory(facts)) },
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Value is required." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const fact = await prisma.customerMemoryFact.findFirst({
      where: { id, businessId: ctx.businessId },
    });
    if (!fact) return json({ error: "Not found." }, 404);
    const updated = await prisma.customerMemoryFact.update({
      where: { id: fact.id },
      data: { value: parsed.data.value, source: "OWNER_INPUT" },
    });
    await persistRebuiltMemory(ctx.businessId, fact.customerId);
    return json({ fact: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const fact = await prisma.customerMemoryFact.findFirst({
      where: { id, businessId: ctx.businessId },
    });
    if (!fact) return json({ error: "Not found." }, 404);
    await prisma.customerMemoryFact.delete({ where: { id } });
    await persistRebuiltMemory(ctx.businessId, fact.customerId);
    return json({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
