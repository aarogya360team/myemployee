import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { applyFact, parseMemory } from "@/lib/usp/memory";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  field: z.string().min(1),
  value: z.string().min(1).max(500),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Memory needs a field and value." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const customer = await prisma.customer.findFirst({
      where: { id, businessId: ctx.businessId },
    });
    if (!customer) return json({ error: "Not found." }, 404);
    const memory = applyFact(parseMemory(customer.memoryJson), {
      field: parsed.data.field,
      value: parsed.data.value,
      source: "OWNER_INPUT",
    });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { memoryJson: JSON.stringify(memory) },
    });
    const fact = await prisma.customerMemoryFact.create({
      data: {
        businessId: ctx.businessId,
        customerId: customer.id,
        field: parsed.data.field,
        value: parsed.data.value,
        source: "OWNER_INPUT",
      },
    });
    return json({ fact });
  } catch (error) {
    return handleError(error);
  }
}
