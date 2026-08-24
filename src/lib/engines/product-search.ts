import type { TenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";

export type ProductHit = {
  sku: string;
  name: string;
  pricePaise: number;
  stock: number;
  confidence: number;
};

export async function searchProducts(ctx: TenantContext, query: string): Promise<ProductHit[]> {
  const q = query.trim();
  if (!q) return [];
  const products = await prisma.product.findMany({
    where: { businessId: ctx.businessId, active: true },
    include: { aliases: true },
  });
  const needle = q.toLowerCase();
  const scored = products.map((product) => {
    let confidence = 0;
    if (product.sku.toLowerCase() === needle) confidence = 1;
    else if (product.aliases.some((a) => a.alias.toLowerCase() === needle)) confidence = 0.95;
    else if (product.name.toLowerCase() === needle) confidence = 0.92;
    else {
      const hay = `${product.sku} ${product.name} ${product.brand ?? ""} ${product.model ?? ""} ${product.aliases.map((a) => a.alias).join(" ")}`.toLowerCase();
      const tokens = needle.split(/\s+/).filter((t) => t.length > 1);
      const hits = tokens.filter((t) => hay.includes(t)).length;
      if (hits) confidence = Math.min(0.88, 0.35 + hits / Math.max(tokens.length, 1) * 0.5);
    }
    return {
      sku: product.sku,
      name: product.name,
      pricePaise: product.pricePaise,
      stock: product.stock,
      confidence,
    };
  });
  return scored.filter((row) => row.confidence >= 0.35).sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
