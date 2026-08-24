import type { TenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/billing/catalog";
import { AI_REVENUE_ROLES, classifyRevenueBucket, sumRevenueOnce } from "./attribution";
import { INSUFFICIENT_DATA } from "./positioning";
import { estimateFromKnownValue, recoveryTypeFromState, upsertOpportunity } from "./recovery";
import { rateFromCounts, scoreEmployee } from "./scorecard";

function startOfTodayIst() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

export async function loadMoneyScreen(ctx: TenantContext) {
  const businessId = ctx.businessId;
  const orders = await prisma.order.findMany({
    where: { businessId },
    include: { payments: true, deliveries: true },
  });
  const conversations = await prisma.conversation.findMany({
    where: { businessId },
    include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const escalations = await prisma.escalation.findMany({
    where: { businessId, status: { in: ["NEW", "OPEN"] } },
    orderBy: { createdAt: "desc" },
  });
  const opportunities = await prisma.recoveryOpportunity.findMany({
    where: { businessId, status: "OPEN" },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const uniqueOrders = orders.map((o) => ({ id: o.id, totalPaise: o.totalPaise, aiRole: o.aiRole, recovered: o.recovered }));
  const aiOrders = uniqueOrders.filter((o) => AI_REVENUE_ROLES.includes(o.aiRole as typeof AI_REVENUE_ROLES[number]));
  const recoveredOrders = uniqueOrders.filter((o) => o.recovered || o.aiRole === "AI_RECOVERED");

  const aiAssistedPaise = sumRevenueOnce(aiOrders);
  const recoveredPaise = sumRevenueOnce(recoveredOrders);
  const enquiryCount = conversations.length;
  const orderCount = orders.length;
  const conversion = enquiryCount >= 3 ? orderCount / enquiryCount : null;

  const incomplete = conversations.filter((c) =>
    !["DELIVERED", "CANCELLED", "REJECTED", "FAILED"].includes(c.currentState),
  );
  const pendingPayments = orders.filter(
    (o) => o.status === "CONFIRMED" || o.payments.some((p) => p.status === "pending"),
  );
  const deliveryIssues = orders.filter((o) =>
    o.deliveries.some((d) => ["FAILED", "EXCEPTION"].includes(d.status)),
  );

  const moneyAtRiskPaise = opportunities.reduce((sum, row) => sum + (row.estimatedOrderValuePaise ?? 0), 0);

  const quoteWaiting = conversations.filter((c) =>
    ["QUOTATION_CREATED", "PRICE_PROVIDED", "CUSTOMER_INTERESTED"].includes(c.currentState),
  );
  const reorderDue = await prisma.customer.count({
    where: {
      businessId,
      lastOrderAt: { lt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
      totalOrders: { gt: 0 },
    },
  });

  return {
    cards: {
      aiAssistedRevenue: { label: "AI-assisted revenue", paise: aiAssistedPaise, display: formatInr(aiAssistedPaise) },
      aiRecoveredRevenue: { label: "AI-recovered revenue", paise: recoveredPaise, display: formatInr(recoveredPaise) },
      orders: { label: "Orders", value: orderCount },
      conversion: {
        label: "Enquiry → order",
        value: conversion,
        display: conversion == null ? INSUFFICIENT_DATA : `${Math.round(conversion * 100)}%`,
      },
      moneyAtRisk: {
        label: "Money at risk",
        paise: moneyAtRiskPaise,
        display: opportunities.length === 0 ? INSUFFICIENT_DATA : formatInr(moneyAtRiskPaise),
        note: "Estimated only from real quotes/order drafts. Never invented.",
      },
    },
    today: [
      {
        id: "quotes",
        text: `${quoteWaiting.length} quotation${quoteWaiting.length === 1 ? "" : "s"} waiting for customer response.`,
        href: "/app/opportunities",
        action: "Follow up",
      },
      {
        id: "risk",
        text:
          moneyAtRiskPaise > 0
            ? `${formatInr(moneyAtRiskPaise)} potential orders need follow-up.`
            : "No estimated rupees at risk yet — estimates appear only after a real quote.",
        href: "/app/opportunities",
        action: "Review",
      },
      {
        id: "reorder",
        text: `${reorderDue} repeat customer${reorderDue === 1 ? "" : "s"} may be due for reorder.`,
        href: "/app/customers",
        action: "Review",
      },
      {
        id: "payments",
        text: `${pendingPayments.length} payment${pendingPayments.length === 1 ? "" : "s"} pending.`,
        href: "/app/opportunities",
        action: "Collect",
      },
      {
        id: "delivery",
        text: `${deliveryIssues.length} ${deliveryIssues.length === 1 ? "delivery needs" : "deliveries need"} intervention.`,
        href: "/app/escalations",
        action: "Take over",
      },
      {
        id: "escalations",
        text: `${escalations.length} customer${escalations.length === 1 ? "" : "s"} need your judgment.`,
        href: "/app/escalations",
        action: "Open queue",
      },
    ],
    incompleteCount: incomplete.length,
    escalations,
    opportunities,
  };
}

export async function loadDailySummary(ctx: TenantContext, employeeName: string) {
  const since = startOfTodayIst();
  const businessId = ctx.businessId;
  const messages = await prisma.message.count({
    where: { conversation: { businessId }, createdAt: { gte: since }, sender: "customer" },
  });
  const orders = await prisma.order.findMany({
    where: { businessId, createdAt: { gte: since } },
  });
  const payments = await prisma.shopPayment.findMany({
    where: { businessId, createdAt: { gte: since }, status: "paid" },
  });
  const escalations = await prisma.escalation.count({
    where: { businessId, createdAt: { gte: since } },
  });
  const followUps = await prisma.timelineEvent.count({
    where: { businessId, createdAt: { gte: since }, kind: "FOLLOW_UP" },
  });
  const recovered = orders.filter((o) => o.recovered || o.aiRole === "AI_RECOVERED");
  const highlights = await prisma.timelineEvent.findMany({
    where: { businessId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const enough = messages + orders.length + escalations + followUps > 0;

  return {
    employeeName,
    enough,
    message: enough ? null : INSUFFICIENT_DATA,
    enquiriesHandled: messages,
    ordersCreated: orders.length,
    revenueAssistedPaise: orders.reduce((s, o) => s + o.totalPaise, 0),
    revenueRecoveredPaise: recovered.reduce((s, o) => s + o.totalPaise, 0),
    paymentsCollectedPaise: payments.reduce((s, p) => s + p.amountPaise, 0),
    customersFollowedUp: followUps,
    escalations,
    highlights: highlights.map((h) => ({ title: h.title, detail: h.detail, at: h.createdAt })),
  };
}

export async function loadScorecard(ctx: TenantContext) {
  const orders = await prisma.order.findMany({
    where: { businessId: ctx.businessId },
    include: { payments: true, deliveries: true },
  });
  const conversations = await prisma.conversation.findMany({
    where: { businessId: ctx.businessId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  const escalations = await prisma.escalation.findMany({ where: { businessId: ctx.businessId } });
  const paid = orders.filter((o) => o.payments.some((p) => p.status === "paid"));
  const delivered = orders.filter((o) => o.deliveries.some((d) => d.status === "DELIVERED"));
  const recoveredPaise = orders
    .filter((o) => o.recovered || o.aiRole === "AI_RECOVERED")
    .reduce((s, o) => s + o.totalPaise, 0);
  const assistedPaise = orders
    .filter((o) => AI_REVENUE_ROLES.includes(o.aiRole as typeof AI_REVENUE_ROLES[number]))
    .reduce((s, o) => s + o.totalPaise, 0);

  const latencies: number[] = [];
  for (const conversation of conversations) {
    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      if (msg.sender !== "customer") continue;
      const reply = conversation.messages.slice(i + 1).find((m) => m.sender === "employee");
      if (!reply) continue;
      latencies.push((reply.createdAt.getTime() - msg.createdAt.getTime()) / 1000);
    }
  }
  const avgLatency = latencies.length >= 5 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;
  const responseSpeed = avgLatency == null ? null : Math.max(0, Math.min(100, Math.round(100 - avgLatency / 2)));

  const feedbacks = await prisma.timelineEvent.findMany({
    where: { businessId: ctx.businessId, kind: "FEEDBACK" },
  });
  const positive = feedbacks.filter((f) => /acha|santusht|good|theek|stars/i.test(f.detail ?? ""));
  const followUps = await prisma.recoveryOpportunity.findMany({ where: { businessId: ctx.businessId } });
  const followUpSuccess = rateFromCounts(followUps.filter((f) => f.recovered).length, followUps.length);

  return scoreEmployee({
    events: conversations.length + orders.length,
    revenueAssistedPaise: assistedPaise,
    revenueRecoveredPaise: recoveredPaise,
    components: {
      responseSpeed,
      enquiryConversion: rateFromCounts(orders.length, conversations.length),
      orderCompletion: rateFromCounts(orders.filter((o) => o.status === "CONFIRMED").length, orders.length),
      paymentCompletion: rateFromCounts(paid.length, orders.length),
      deliveryCompletion: rateFromCounts(delivered.length, orders.length),
      followUpSuccess,
      customerSatisfaction: rateFromCounts(positive.length, feedbacks.length),
      escalationQuality: rateFromCounts(
        escalations.filter((e) => e.status === "RESOLVED").length,
        escalations.length,
      ),
      humanTakeoverRate: rateFromCounts(escalations.length, conversations.length),
    },
  });
}

export async function syncRecoveryOpportunities(ctx: TenantContext) {
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  const conversations = await prisma.conversation.findMany({
    where: {
      businessId: ctx.businessId,
      status: "OPEN",
      updatedAt: { lt: staleBefore },
    },
  });

  for (const conversation of conversations) {
    const draft = safeDraft(conversation.draftJson);
    const type = recoveryTypeFromState(conversation.currentState, {
      promisedLater: draft.promisedLater,
      stockShort: draft.stockShort,
    });
    if (!type) continue;
    await upsertOpportunity(ctx, {
      customerId: conversation.customerId,
      conversationId: conversation.id,
      source: conversation.channel,
      type,
      estimatedOrderValuePaise: estimateFromKnownValue(draft.pricePaise, draft.quantity),
      lastInteractionAt: conversation.updatedAt,
    });
  }

  const customers = await prisma.customer.findMany({
    where: { businessId: ctx.businessId, totalOrders: { gt: 0 } },
    include: { orders: { include: { items: true }, orderBy: { createdAt: "desc" } } },
  });
  const threeWeeks = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  for (const customer of customers) {
    if (customer.lastOrderAt && customer.lastOrderAt < threeWeeks) {
      const last = customer.orders[0];
      await upsertOpportunity(ctx, {
        customerId: customer.id,
        source: "REPEAT",
        type: "NO_REORDER",
        estimatedOrderValuePaise: last?.totalPaise ?? null,
        lastInteractionAt: customer.lastOrderAt,
      });
    }
    const bySku = new Map<string, (typeof customer.orders)[0]>();
    for (const order of customer.orders) {
      for (const item of order.items) {
        if (!bySku.has(item.name)) bySku.set(item.name, order);
      }
    }
    for (const [sku, order] of bySku) {
      if (order.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        await upsertOpportunity(ctx, {
          customerId: customer.id,
          source: sku,
          type: "STOPPED_BUYING_SKU",
          estimatedOrderValuePaise: order.totalPaise,
          lastInteractionAt: order.createdAt,
        });
      }
    }
  }

  const complaints = await prisma.escalation.findMany({
    where: {
      businessId: ctx.businessId,
      reason: { contains: "Complaint" },
      createdAt: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
  });
  for (const row of complaints) {
    if (!row.customerId) continue;
    const later = await prisma.conversation.findFirst({
      where: { businessId: ctx.businessId, customerId: row.customerId, createdAt: { gt: row.createdAt } },
    });
    if (later) continue;
    await upsertOpportunity(ctx, {
      customerId: row.customerId,
      conversationId: row.conversationId,
      source: "COMPLAINT",
      type: "COMPLAINT_NO_RETURN",
      estimatedOrderValuePaise: null,
      lastInteractionAt: row.createdAt,
    });
  }
}

function safeDraft(raw: string) {
  try {
    return JSON.parse(raw) as { pricePaise?: number; quantity?: number; promisedLater?: boolean; stockShort?: boolean };
  } catch {
    return {};
  }
}

export function formatMoneyCard(paise: number, emptyLabel = INSUFFICIENT_DATA) {
  if (paise <= 0) return emptyLabel;
  return formatInr(paise);
}

export { classifyRevenueBucket };
