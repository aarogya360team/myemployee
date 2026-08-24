import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import {
  bookDelivery,
  confirmOrder,
  requestPayment,
  sendInvoice,
} from "@/lib/usp/fulfillment";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const orders = await prisma.order.findMany({
      where: { businessId: ctx.businessId },
      include: { payments: true, deliveries: true, invoices: true, customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return json({ orders });
  } catch (error) {
    return handleError(error);
  }
}

const actionSchema = z.object({
  orderId: z.string(),
  action: z.enum(["confirm", "request_payment", "send_invoice", "book_delivery"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid action." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const { orderId, action } = parsed.data;
    if (action === "confirm") return json({ order: await confirmOrder(ctx, orderId) });
    if (action === "request_payment") return json({ payment: await requestPayment(ctx, orderId) });
    if (action === "send_invoice") return json({ invoice: await sendInvoice(ctx, orderId) });
    return json({ delivery: await bookDelivery(ctx, orderId) });
  } catch (error) {
    return handleError(error);
  }
}
