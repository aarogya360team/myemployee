import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { trackFunnel } from "@/lib/funnel";
import { z } from "zod";

const rowSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(200),
  brand: z.string().trim().max(80).optional(),
  pricePaise: z.number().int().positive(),
  stock: z.number().int().min(0),
  aliases: z.array(z.string().trim().min(2)).max(10).optional(),
});

function parsePriceToPaise(raw: string) {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const skuI = headers.findIndex((h) => h === "sku");
  const nameI = headers.findIndex((h) => h === "name");
  const brandI = headers.findIndex((h) => h === "brand");
  const priceI = headers.findIndex((h) => h === "price" || h === "rate" || h === "price_inr");
  const stockI = headers.findIndex((h) => h === "stock");
  const aliasI = headers.findIndex((h) => h === "aliases" || h === "alias");
  if (skuI < 0 || nameI < 0 || priceI < 0) return [];
  const rows = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const pricePaise = parsePriceToPaise(cols[priceI] ?? "");
    if (!pricePaise) continue;
    const aliases = aliasI >= 0 && cols[aliasI]
      ? cols[aliasI]
          .split(/[;|]/)
          .map((a) => a.trim())
          .filter((a) => a.length >= 2)
          .slice(0, 10)
      : undefined;
    rows.push({
      sku: cols[skuI],
      name: cols[nameI],
      brand: brandI >= 0 ? cols[brandI] || undefined : undefined,
      pricePaise,
      stock: stockI >= 0 ? Math.max(0, Number(cols[stockI] || 0)) : 0,
      aliases,
    });
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const contentType = request.headers.get("content-type") ?? "";
    let rows: z.infer<typeof rowSchema>[] = [];
    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      rows = parseCsv(await request.text())
        .map((row) => rowSchema.safeParse(row))
        .filter((p) => p.success)
        .map((p) => p.data);
    } else {
      const body = await request.json();
      const parsed = z.array(rowSchema).min(1).max(200).safeParse(body.products ?? body);
      if (!parsed.success) return json({ error: "CSV needs sku, name, and price columns." }, 400);
      rows = parsed.data;
    }
    if (rows.length === 0) return json({ error: "No valid products in that file." }, 400);

    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      try {
        await prisma.product.create({
          data: {
            businessId: ctx.businessId,
            sku: row.sku,
            name: row.name,
            brand: row.brand || null,
            pricePaise: row.pricePaise,
            stock: row.stock,
            aliases: row.aliases?.length ? { create: row.aliases.map((alias) => ({ alias })) } : undefined,
          },
        });
        created += 1;
      } catch {
        skipped += 1;
      }
    }
    if (created > 0) {
      await trackFunnel({ name: "catalogue_uploaded", businessId: ctx.businessId, userId: session.user.id });
    }
    return json({ created, skipped, total: rows.length });
  } catch (error) {
    return handleError(error);
  }
}
