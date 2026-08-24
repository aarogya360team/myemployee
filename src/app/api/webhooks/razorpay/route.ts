import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { razorpaySignatureOk } from "@/lib/providers/razorpay";
import { getRazorpayConfig } from "@/lib/integrations";
import { markPaymentPaidByProvider } from "@/lib/usp/fulfillment";
import { resolveTenantContext } from "@/lib/platform/tenant";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  let body: RazorpayHook;
  try {
    body = JSON.parse(raw) as RazorpayHook;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const payment = body.payload?.payment_link?.entity;
  const orderId = payment?.notes?.aurelPaymentRef;
  if (!orderId) return json({ ok: true, ignored: true });

  const shopPayment = await prisma.shopPayment.findFirst({
    where: { orderId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!shopPayment) return json({ ok: true, ignored: true });

  const config = await getRazorpayConfig(shopPayment.businessId);
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (config?.webhookSecret && !razorpaySignatureOk(raw, signature, config.webhookSecret)) {
    return json({ error: "Bad signature." }, 401);
  }

  if (body.event !== "payment_link.paid" && payment?.status !== "paid") {
    return json({ ok: true, ignored: true });
  }

  const owner = await prisma.businessMembership.findFirst({
    where: { businessId: shopPayment.businessId, role: "OWNER" },
  });
  if (!owner) return json({ ok: true });
  const ctx = await resolveTenantContext(owner.userId, shopPayment.businessId, shopPayment.businessId);
  await markPaymentPaidByProvider(ctx, shopPayment.id);
  return json({ ok: true });
}

type RazorpayHook = {
  event?: string;
  payload?: {
    payment_link?: {
      entity?: {
        status?: string;
        notes?: { aurelPaymentRef?: string };
      };
    };
  };
};
