import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(200),
  brand: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  pricePaise: z.number().int().positive(),
  stock: z.number().int().min(0),
  aliases: z.array(z.string().trim().min(2)).max(10).optional(),
});

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const products = await prisma.product.findMany({
      where: { businessId: ctx.businessId },
      include: { aliases: true },
      orderBy: { name: "asc" },
    });
    return json({ products });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Product details incomplete." }, 400);
    const product = await prisma.product.create({
      data: {
        businessId: ctx.businessId,
        sku: parsed.data.sku,
        name: parsed.data.name,
        brand: parsed.data.brand || null,
        model: parsed.data.model || null,
        pricePaise: parsed.data.pricePaise,
        stock: parsed.data.stock,
        aliases: parsed.data.aliases?.length
          ? { create: parsed.data.aliases.map((alias) => ({ alias })) }
          : undefined,
      },
      include: { aliases: true },
    });
    return json({ product }, 201);
  } catch (error) {
    return handleError(error);
  }
}
