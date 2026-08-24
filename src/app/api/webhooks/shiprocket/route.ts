import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { markDeliveredByProvider } from "@/lib/usp/fulfillment";
import { resolveTenantContext } from "@/lib/platform/tenant";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    awb?: string;
    current_status?: string;
    shipment_status?: string;
  };
  const tracking = body.awb;
  const delivered =
    /delivered/i.test(body.current_status ?? "") || /delivered/i.test(body.shipment_status ?? "");
  if (!tracking || !delivered) return json({ ok: true, ignored: true });

  const delivery = await prisma.delivery.findFirst({
    where: { trackingId: tracking },
  });
  if (!delivery) return json({ ok: true, ignored: true });

  const owner = await prisma.businessMembership.findFirst({
    where: { businessId: delivery.businessId, role: "OWNER" },
  });
  if (!owner) return json({ ok: true });
  const ctx = await resolveTenantContext(owner.userId, delivery.businessId, delivery.businessId);
  await markDeliveredByProvider(ctx, delivery.id);
  return json({ ok: true });
}
