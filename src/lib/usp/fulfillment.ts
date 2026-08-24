import type { TenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/tenant";
import { getRazorpayConfig, getShiprocketConfig } from "@/lib/integrations";
import { deliveryFor, messagingFor, paymentsFor } from "@/lib/providers/resolve";

async function getOrder(ctx: TenantContext, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId: ctx.businessId },
    include: { payments: true, deliveries: true, invoices: true, customer: true, items: true },
  });
  if (!order) throw new HttpError(404, "Order not found.");
  return order;
}

export async function confirmOrder(ctx: TenantContext, orderId: string) {
  const order = await getOrder(ctx, orderId);
  if (order.status === "DRAFT") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
  }
  if (order.conversationId) {
    await prisma.conversation.update({
      where: { id: order.conversationId },
      data: { currentState: "ORDER_CONFIRMED", nextBestAction: "REQUEST_PAYMENT" },
    });
  }
  return getOrder(ctx, orderId);
}

export async function requestPayment(ctx: TenantContext, orderId: string) {
  const order = await confirmOrder(ctx, orderId);
  const existing = order.payments.find((p) => p.status === "pending" || p.status === "paid");
  if (existing?.status === "paid") return existing;
  if (existing?.status === "pending") return existing;

  const pay = await paymentsFor(ctx.businessId);
  const razorpay = await getRazorpayConfig(ctx.businessId);
  const link = await pay.createPaymentLink({
    amountPaise: order.totalPaise,
    reference: order.id,
    customerPhone: order.customer?.phone ?? undefined,
    customerName: order.customer?.name ?? undefined,
    description: `Order ${order.id.slice(-6)}`,
  });
  if (!link.ok) {
    throw new HttpError(502, "Payment provider did not create a link. Not marked as requested.");
  }
  const payment = await prisma.shopPayment.create({
    data: {
      businessId: ctx.businessId,
      orderId: order.id,
      provider: razorpay ? "razorpay" : "mock",
      status: "pending",
      amountPaise: order.totalPaise,
      link: link.url,
    },
  });
  if (order.conversationId) {
    await prisma.conversation.update({
      where: { id: order.conversationId },
      data: { currentState: "PAYMENT_PENDING", nextBestAction: "REQUEST_PAYMENT" },
    });
  }
  if (order.customerId) {
    await prisma.timelineEvent.create({
      data: {
        businessId: ctx.businessId,
        customerId: order.customerId,
        conversationId: order.conversationId,
        channel: order.source,
        kind: "REQUEST_PAYMENT",
        title: "Payment requested",
        detail: `Link created by provider (${link.id}). Status still pending.`,
      },
    });
  }
  return payment;
}

/** Provider webhook only. Never call this because a human guessed the customer paid. */
export async function markPaymentPaidByProvider(ctx: TenantContext, paymentId: string) {
  const payment = await prisma.shopPayment.findFirst({
    where: { id: paymentId, businessId: ctx.businessId },
    include: { order: true },
  });
  if (!payment) throw new HttpError(404, "Payment not found.");
  if (payment.status === "paid") return payment;

  const updated = await prisma.shopPayment.update({
    where: { id: payment.id },
    data: { status: "paid" },
  });

  const number = `INV-${payment.orderId.slice(-6).toUpperCase()}`;
  await prisma.shopInvoice.create({
    data: {
      businessId: ctx.businessId,
      orderId: payment.orderId,
      number,
      kind: "TAX",
      totalPaise: payment.amountPaise,
      sent: false,
    },
  });

  if (payment.order.conversationId) {
    await prisma.conversation.update({
      where: { id: payment.order.conversationId },
      data: { currentState: "PAYMENT_RECEIVED", nextBestAction: "START_FULFILLMENT" },
    });
  }
  if (payment.order.customerId) {
    await prisma.timelineEvent.create({
      data: {
        businessId: ctx.businessId,
        customerId: payment.order.customerId,
        conversationId: payment.order.conversationId,
        channel: payment.order.source,
        kind: "PAYMENT_RECEIVED",
        title: "Payment received",
        detail: "Provider confirmed paid. Invoice generated, not sent until WhatsApp send is confirmed.",
      },
    });
  }
  return updated;
}

export async function sendInvoice(ctx: TenantContext, orderId: string) {
  const order = await getOrder(ctx, orderId);
  const paid = order.payments.some((p) => p.status === "paid");
  if (!paid) throw new HttpError(409, "Invoice is not sent until payment is confirmed.");
  const invoice = order.invoices[0];
  if (!invoice) throw new HttpError(404, "Invoice not generated yet.");
  const to = order.customer?.phone;
  if (!to || to === "TRYOUT") {
    throw new HttpError(409, "No customer WhatsApp number to send the bill.");
  }
  const wa = await messagingFor(ctx.businessId);
  const sent = await wa.sendDocument(to, `/invoices/${invoice.number}`, `${invoice.number}.pdf`);
  if (!sent.ok) throw new HttpError(502, "WhatsApp did not confirm the bill was sent.");
  return prisma.shopInvoice.update({ where: { id: invoice.id }, data: { sent: true } });
}

/** Delivery is refused until a provider-confirmed paid payment exists. */
export function canBookDelivery(payments: { status: string }[]) {
  return payments.some((p) => p.status === "paid");
}

export async function bookDelivery(ctx: TenantContext, orderId: string) {
  const order = await getOrder(ctx, orderId);
  if (!canBookDelivery(order.payments)) {
    throw new HttpError(409, "Delivery is not booked until payment is confirmed.");
  }
  const existing = order.deliveries[0];
  if (existing) return existing;
  const courier = await deliveryFor(ctx.businessId);
  const shiprocket = await getShiprocketConfig(ctx.businessId);
  const booked = await courier.createDelivery({
    orderId: order.id,
    customerName: order.customer?.name ?? undefined,
    customerPhone: order.customer?.phone ?? "",
    address: order.customer ? (await prisma.customerAddress.findFirst({ where: { customerId: order.customer.id } }))?.line ?? "Address on file" : "Address on file",
    items: order.items.map((item) => ({ name: item.name, qty: item.qty, pricePaise: item.pricePaise })),
  });
  if (!booked.ok) throw new HttpError(502, "Delivery provider did not confirm booking.");
  const row = await prisma.delivery.create({
    data: {
      businessId: ctx.businessId,
      orderId: order.id,
      provider: shiprocket ? "shiprocket" : "mock",
      status: "BOOKED",
      trackingId: booked.trackingId,
      quotePaise: 12000,
    },
  });
  if (order.conversationId) {
    await prisma.conversation.update({
      where: { id: order.conversationId },
      data: { currentState: "DELIVERY_BOOKED", nextBestAction: "BOOK_DELIVERY" },
    });
  }
  if (order.customerId) {
    await prisma.timelineEvent.create({
      data: {
        businessId: ctx.businessId,
        customerId: order.customerId,
        conversationId: order.conversationId,
        channel: order.source,
        kind: "DELIVERY_BOOKED",
        title: "Delivery booked",
        detail: `Provider tracking ${booked.trackingId}`,
      },
    });
  }
  return row;
}

export async function markDeliveredByProvider(ctx: TenantContext, deliveryId: string) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: ctx.businessId },
    include: { order: true },
  });
  if (!delivery) throw new HttpError(404, "Delivery not found.");
  const updated = await prisma.delivery.update({
    where: { id: delivery.id },
    data: { status: "DELIVERED" },
  });
  if (delivery.order.conversationId) {
    await prisma.conversation.update({
      where: { id: delivery.order.conversationId },
      data: { currentState: "DELIVERED", nextBestAction: "REQUEST_FEEDBACK" },
    });
  }
  if (delivery.order.customerId) {
    await prisma.customer.update({
      where: { id: delivery.order.customerId },
      data: {
        lastOrderAt: new Date(),
        totalOrders: { increment: 1 },
        totalValuePaise: { increment: delivery.order.totalPaise },
      },
    });
    await prisma.timelineEvent.create({
      data: {
        businessId: ctx.businessId,
        customerId: delivery.order.customerId,
        conversationId: delivery.order.conversationId,
        channel: delivery.order.source,
        kind: "DELIVERED",
        title: "Delivered",
        detail: "Provider confirmed delivered.",
      },
    });
  }
  return updated;
}

export async function sendFollowUpMessage(ctx: TenantContext, customerId: string, body: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: ctx.businessId },
  });
  if (!customer) throw new HttpError(404, "Customer not found.");
  if (!customer.phone || customer.phone === "TRYOUT") {
    return { queued: true, sent: false as const, id: null };
  }
  const wa = await messagingFor(ctx.businessId);
  const result = await wa.sendMessage(customer.phone, body);
  if (!result.ok) throw new HttpError(502, "WhatsApp did not confirm the follow-up was sent.");
  await prisma.timelineEvent.create({
    data: {
      businessId: ctx.businessId,
      customerId: customer.id,
      channel: "WHATSAPP",
      kind: "FOLLOW_UP",
      title: "Follow-up sent",
      detail: body.slice(0, 180),
    },
  });
  return { queued: false, sent: true as const, id: result.id };
}
