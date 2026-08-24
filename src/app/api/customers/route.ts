import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { applyFact, parseMemory } from "@/lib/usp/memory";
import { NextRequest } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  phone: z.string().trim().min(8).max(20),
  name: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Phone is required." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const phone = parsed.data.phone.replace(/\D/g, "");
    if (phone.length < 10) return json({ error: "Enter a 10-digit mobile number." }, 400);
    const last10 = phone.slice(-10);
    const customer = await prisma.customer.upsert({
      where: { businessId_phone: { businessId: ctx.businessId, phone: last10 } },
      update: { name: parsed.data.name || undefined },
      create: {
        businessId: ctx.businessId,
        phone: last10,
        name: parsed.data.name || null,
        segment: "STAFF_ENTRY",
      },
    });
    if (parsed.data.note) {
      const memory = applyFact(parseMemory(customer.memoryJson), {
        field: "note",
        value: parsed.data.note,
        source: "OWNER_INPUT",
      });
      await prisma.customer.update({
        where: { id: customer.id },
        data: { memoryJson: JSON.stringify(memory) },
      });
      await prisma.customerMemoryFact.create({
        data: {
          businessId: ctx.businessId,
          customerId: customer.id,
          field: "note",
          value: parsed.data.note,
          source: "OWNER_INPUT",
        },
      });
    }
    await prisma.timelineEvent.create({
      data: {
        businessId: ctx.businessId,
        customerId: customer.id,
        channel: "STAFF",
        kind: "STAFF_ENTRY",
        title: "Staff recorded customer",
        detail: parsed.data.name ?? last10,
      },
    });
    return json({ customer }, 201);
  } catch (error) {
    return handleError(error);
  }
}
