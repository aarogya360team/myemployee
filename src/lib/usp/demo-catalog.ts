import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/platform/tenant";

/** Electrical demo SKUs — DEMO_MODE or the WhatsApp test chat. Never presented as live shop data. */
export const ELECTRICAL_DEMO_PRODUCTS = [
  {
    sku: "PH-LED-12W-B22",
    name: "Philips 12W B22 LED bulb",
    brand: "Philips",
    model: "12W B22",
    pricePaise: 8500,
    wholesalePaise: 7200,
    stock: 320,
    aliases: ["12 watt philips", "philips 12w", "12w b22", "12 watt bulb"],
  },
  {
    sku: "HAV-WIRE-1.5",
    name: "Havells 1.5 sq mm FR wire (90m)",
    brand: "Havells",
    model: "1.5 sq mm",
    pricePaise: 185000,
    wholesalePaise: 168000,
    stock: 40,
    aliases: ["1.5 wire", "havells wire"],
  },
];

export async function seedElectricalDemoCatalog(ctx: TenantContext) {
  for (const product of ELECTRICAL_DEMO_PRODUCTS) {
    const row = await prisma.product.upsert({
      where: { businessId_sku: { businessId: ctx.businessId, sku: product.sku } },
      update: {
        name: product.name,
        brand: product.brand,
        model: product.model,
        pricePaise: product.pricePaise,
        wholesalePaise: product.wholesalePaise,
        stock: product.stock,
        active: true,
      },
      create: {
        businessId: ctx.businessId,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        model: product.model,
        pricePaise: product.pricePaise,
        wholesalePaise: product.wholesalePaise,
        stock: product.stock,
        active: true,
      },
    });
    for (const alias of product.aliases) {
      const exists = await prisma.productAlias.findFirst({
        where: { productId: row.id, alias },
      });
      if (!exists) {
        await prisma.productAlias.create({ data: { productId: row.id, alias } });
      }
    }
  }
}

export function formatPaiseLabel(paise: number) {
  return `₹${Math.round(paise / 100)}`;
}
