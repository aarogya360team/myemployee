import { incrementUsage } from "@/lib/billing/entitlements";
import { searchProducts } from "@/lib/engines/product-search";
import { detectIntent, handleCustomerTurn } from "@/lib/language";
import type { AppLanguage } from "@/lib/constants";
import { getPlatformEnv } from "@/lib/platform/env";
import type { TenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/tenant";
import { nextBestAction, parseDiscountPercent, parseQuantity, type JourneyDraft, type JourneyState } from "./completion";
import { seedElectricalDemoCatalog, formatPaiseLabel } from "./demo-catalog";
import { applyFact, parseMemory } from "./memory";
import { buildHandoffSummary, escalationPriority, looksAngry, requestsCredit, requestsManager } from "./escalation";
import { evaluateCreditRequest, evaluateDiscountRule, ensureDefaultRules, type StoredRule } from "./rules";
import { getVerticalProfile } from "./verticals";
import { matchCustomerIdentity } from "./continuity";
import { promisedLater, markOpportunityRecovered } from "./recovery";
import { bookDelivery, requestPayment } from "./fulfillment";
import { resolveEmployeeDuty } from "@/lib/employee-duty";
import { parsePersonality } from "@/lib/employee-identity";
import { polishEmployeeReply } from "@/lib/llm/rewrite-reply";

type Channel = "whatsapp" | "web" | "phone" | "instagram";

export async function processOwnerTryoutTurn(input: {
  ctx: TenantContext;
  userId: string;
  businessName: string;
  employeeName: string;
  employeeId: string;
  text: string;
  channel: Channel;
  previousLanguage?: AppLanguage;
  conversationId?: string;
  customerPhone?: string;
  customerName?: string;
}) {
  return processCustomerTurn(input);
}

export async function processCustomerTurn(input: {
  ctx: TenantContext;
  userId: string;
  businessName: string;
  employeeName: string;
  employeeId: string;
  text: string;
  channel: Channel;
  previousLanguage?: AppLanguage;
  conversationId?: string;
  customerPhone?: string;
  customerName?: string;
}) {
  if (getPlatformEnv().demoMode) {
    await seedElectricalDemoCatalog(input.ctx);
  }
  await ensureDefaultRules(input.ctx.businessId);

  const businessRow = await prisma.business.findFirst({
    where: { id: input.ctx.businessId },
    include: { hours: true },
  });
  const vertical = getVerticalProfile(businessRow?.vertical);

  const requestedPhone = (input.customerPhone ?? "TRYOUT").trim() || "TRYOUT";
  const existing = await prisma.customer.findMany({
    where: { businessId: input.ctx.businessId },
    select: { phone: true },
  });
  const match = matchCustomerIdentity({
    phone: requestedPhone === "TRYOUT" ? requestedPhone : requestedPhone,
    existingPhones: existing.map((c) => c.phone),
  });
  const phone =
    requestedPhone === "TRYOUT"
      ? "TRYOUT"
      : match.customerPhone ?? (match.askConfirmation && requestedPhone.replace(/\D/g, "").length >= 10 ? requestedPhone.replace(/\D/g, "").slice(-10) : requestedPhone);

  const customer = await prisma.customer.upsert({
    where: {
      businessId_phone: { businessId: input.ctx.businessId, phone },
    },
    update: input.customerName ? { name: input.customerName } : {},
    create: {
      businessId: input.ctx.businessId,
      phone,
      name: input.customerName || (phone === "TRYOUT" ? "Tryout customer" : null),
      segment: phone === "TRYOUT" ? "TRYOUT" : "NEW",
      notes: phone === "TRYOUT" ? "Web tryout — not a live WhatsApp customer" : null,
    },
  });

  const conversation = input.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: input.conversationId, businessId: input.ctx.businessId },
      })
    : await prisma.conversation.findFirst({
        where: {
          businessId: input.ctx.businessId,
          customerId: customer.id,
          channel: input.channel.toUpperCase(),
          status: "OPEN",
        },
        orderBy: { updatedAt: "desc" },
      });

  const live =
    conversation ??
    (await prisma.conversation.create({
      data: {
        businessId: input.ctx.businessId,
        customerId: customer.id,
        channel: input.channel.toUpperCase(),
        language: input.previousLanguage ?? "hinglish",
        currentState: "NEW_ENQUIRY",
        responsibleEmployeeId: input.employeeId,
      },
    }));

  if (live.controlMode === "HUMAN") {
    await prisma.message.create({
      data: { conversationId: live.id, sender: "customer", body: input.text },
    });
    return {
      muted: true,
      conversationId: live.id,
      reply: "Aap baat handle kar rahe ho. AI employee is on mute until you hand it back.",
      language: input.previousLanguage ?? "hinglish",
      intent: "other",
      currentState: live.currentState,
      nextBestAction: live.nextBestAction,
      reason: "Human takeover",
      confidence: 1,
      escalate: false,
      voice: null,
    };
  }

  const duty = await resolveEmployeeDuty(input.employeeId);
  if (duty.muted && duty.reply) {
    await prisma.message.create({
      data: { conversationId: live.id, sender: "customer", body: input.text },
    });
    await prisma.message.create({
      data: { conversationId: live.id, sender: "employee", body: duty.reply },
    });
    return {
      muted: true,
      conversationId: live.id,
      reply: duty.reply,
      language: input.previousLanguage ?? "hinglish",
      intent: "other",
      currentState: live.currentState,
      nextBestAction: live.nextBestAction,
      reason: "Employee paused",
      confidence: 1,
      escalate: false,
      voice: null,
    };
  }

  await prisma.message.create({
    data: { conversationId: live.id, sender: "customer", body: input.text },
  });

  const hits = await searchProducts(input.ctx, input.text);
  const best = hits[0];
  const draft = parseJson<JourneyDraft>(live.draftJson, {});
  if (best) {
    draft.productSku = best.sku;
    draft.productName = best.name;
    draft.pricePaise = best.pricePaise;
    draft.stock = best.stock;
  }
  const qty = parseQuantity(input.text);
  if (qty) draft.quantity = qty;
  if (promisedLater(input.text)) draft.promisedLater = true;
  if (best && (draft.quantity ?? 0) > best.stock) draft.stockShort = true;

  const rules = await loadRules(input.ctx.businessId);
  const discount = evaluateDiscountRule(rules, parseDiscountPercent(input.text));
  const credit = evaluateCreditRequest(rules, requestsCredit(input.text));
  const angry = looksAngry(input.text);
  const manager = requestsManager(input.text);
  const intent = detectIntent(input.text);

  const escalateForced =
    discount.escalate || credit.escalate || angry || manager || intent === "refund" || intent === "complaint";
  const escalateReason =
    discount.reason ??
    credit.reason ??
    (angry ? "Customer appears angry" : null) ??
    (manager ? "Customer requested owner/manager" : null);

  const completion = nextBestAction({
    currentState: (live.currentState as JourneyState) || "NEW_ENQUIRY",
    intent,
    text: input.text,
    draft,
    productConfidence: best?.confidence ?? 0,
    productFound: Boolean(best),
    stockKnown: best != null,
    stockOk: best ? best.stock >= (draft.quantity ?? 1) : undefined,
    priceKnown: Boolean(best && best.pricePaise > 0),
    escalateForced,
    escalateReason: escalateReason ?? undefined,
  });

  const employeeRow = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  const personality = parsePersonality(parseJson(employeeRow?.personality ?? "{}", {}));

  const turn = handleCustomerTurn({
    text: input.text,
    channel: input.channel === "instagram" ? "web" : input.channel,
    employeeName: input.employeeName,
    businessName: input.businessName,
    previousLanguage: input.previousLanguage,
    personality: {
      greeting: personality.greeting,
      addressForm: personality.addressForm,
      verbosity: personality.verbosity,
    },
    verified:
      best && (completion.nextBestAction === "PROVIDE_PRICE" || completion.nextBestAction === "CREATE_QUOTE")
        ? {
            productName: best.name,
            priceLabel: formatPaiseLabel(best.pricePaise),
            stockOk: best.stock >= (draft.quantity ?? 1),
          }
        : undefined,
  });

  let reply = turn.reply;
  if (completion.nextBestAction === "CREATE_QUOTE" && best && draft.quantity) {
    const total = formatPaiseLabel(best.pricePaise * draft.quantity);
    reply =
      turn.language === "en"
        ? `Quote: ${draft.quantity} × ${best.name} = ${total} (catalogue). Shall I make the order? Delivery address?`
        : `Quote: ${draft.quantity} × ${best.name} = ${total} (catalogue se). Order banaun? Delivery address?`;
    completion.currentState = "QUOTATION_CREATED";
  }
  if (completion.nextBestAction === "ASK_PRODUCT_CLARIFICATION" && !best) {
    const terms = vertical.terminology.slice(0, 4).join(", ");
    const units = vertical.units.join("/");
    reply =
      turn.language === "en"
        ? `Which item — ${terms}? Units we use: ${units}. I will check our list before quoting.`
        : `Kaunsa item — ${terms}? Unit: ${units}. Catalogue se confirm karke rate bataunga.`;
  }

  if (completion.nextBestAction === "CREATE_ORDER" && best && draft.quantity && draft.address) {
    const order = await prisma.order.create({
      data: {
        businessId: input.ctx.businessId,
        customerId: customer.id,
        conversationId: live.id,
        status: "DRAFT",
        attribution: "AI_ASSISTED",
        aiRole: "AI_ASSISTED",
        source: input.channel.toUpperCase(),
        totalPaise: best.pricePaise * draft.quantity,
        employeeId: input.employeeId,
        attributionEvidence: JSON.stringify({
          conversationId: live.id,
          customerId: customer.id,
          employeeId: input.employeeId,
          timestamps: [new Date().toISOString()],
          touchpoints: ["AI_ASSISTED"],
          uncertain: false,
        }),
        items: {
          create: {
            name: best.name,
            qty: draft.quantity,
            pricePaise: best.pricePaise,
          },
        },
      },
    });
    completion.currentState = "ORDER_DRAFT";
    const recoveredRow = await markOpportunityRecovered(input.ctx, {
      conversationId: live.id,
      customerId: customer.id,
      valuePaise: best.pricePaise * draft.quantity,
    });
    if (recoveredRow) {
      await prisma.order.update({
        where: { id: order.id },
        data: { recovered: true, aiRole: "AI_RECOVERED" },
      });
    }
    try {
      await requestPayment(input.ctx, order.id);
      completion.currentState = "PAYMENT_PENDING";
      completion.nextBestAction = "REQUEST_PAYMENT";
      reply =
        turn.language === "en"
          ? `Order ${order.id.slice(-6)} is confirmed as a draft/payment request. I will not mark it paid until the payment provider confirms.`
          : `Order ${order.id.slice(-6)} payment request nikal diya. Provider confirm kare tabhi paid likhunga.`;
    } catch {
      reply =
        turn.language === "en"
          ? `Order draft ${order.id.slice(-6)} is ready. I will not mark it paid until payment is confirmed.`
          : `Order draft ${order.id.slice(-6)} ready hai. Payment confirm hone se pehle paid nahi likhunga.`;
    }
  }

  const openOrder = await prisma.order.findFirst({
    where: { businessId: input.ctx.businessId, conversationId: live.id },
    include: { payments: true, deliveries: true },
    orderBy: { createdAt: "desc" },
  });
  if (openOrder && completion.nextBestAction === "REQUEST_PAYMENT" && !openOrder.payments.some((p) => p.status === "paid")) {
    try {
      const pay = await requestPayment(input.ctx, openOrder.id);
      reply =
        turn.language === "en"
          ? `Payment link is ready (${pay.link}). I will not mark paid until the provider confirms.`
          : `Payment link ready hai. Provider confirm kare tabhi paid.`;
    } catch {
      /* keep existing reply */
    }
  }
  if (openOrder && (completion.nextBestAction === "START_FULFILLMENT" || completion.nextBestAction === "BOOK_DELIVERY")) {
    try {
      const delivery = await bookDelivery(input.ctx, openOrder.id);
      reply =
        turn.language === "en"
          ? `Delivery booked. Tracking ${delivery.trackingId}. Not marked delivered until the courier confirms.`
          : `Delivery book ho gayi. Tracking ${delivery.trackingId}. Courier confirm kare tabhi delivered.`;
    } catch {
      reply =
        turn.language === "en"
          ? "Payment is still pending or the courier did not confirm. I will not pretend delivery is done."
          : "Payment pending hai ya courier confirm nahi hua. Delivered nahi likhunga.";
    }
  }
  if (intent === "feedback") {
    await prisma.timelineEvent.create({
      data: {
        businessId: input.ctx.businessId,
        customerId: customer.id,
        conversationId: live.id,
        channel: input.channel.toUpperCase(),
        kind: "FEEDBACK",
        title: "Customer feedback",
        detail: input.text.slice(0, 240),
      },
    });
  }

  if (completion.responsibleEmployee === "HUMAN" || completion.nextBestAction === "ESCALATE_HUMAN") {
    const handoff = buildHandoffSummary({
      customerName: customer.name,
      requestedQty: draft.quantity,
      productName: best?.name,
      inventory: best?.stock,
      specialPricing: discount.escalate,
      reason: completion.blockingReason ?? completion.reason,
    });
    await prisma.escalation.create({
      data: {
        businessId: input.ctx.businessId,
        conversationId: live.id,
        customerId: customer.id,
        reason: completion.blockingReason ?? "Needs owner",
        priority: escalationPriority(
          discount.escalate ? "pricing_exception" : angry ? "angry" : "policy_exception",
          draft.quantity,
        ),
        summary: handoff.summary,
        recommendation: handoff.recommendedAction,
        status: "NEW",
      },
    });
    reply = turn.escalate
      ? turn.reply
      : turn.language === "en"
        ? "I'll get the owner on this. I've written a short brief so they don't need the full chat."
        : "Owner se confirm karwaata hoon. Unke liye short brief likh diya — poori chat padhne ki zaroorat nahi.";
  }

  const priceLabels = [
    best ? formatPaiseLabel(best.pricePaise) : "",
    best && draft.quantity ? formatPaiseLabel(best.pricePaise * draft.quantity) : "",
  ].filter(Boolean);
  reply = await polishEmployeeReply({
    draft: reply,
    language: turn.language,
    employeeName: input.employeeName,
    businessName: input.businessName,
    tone: personality.tone || "friendly",
    customerText: input.text,
    facts: {
      priceLabels,
      productNames: best ? [best.name] : [],
    },
    nextAction: completion.nextBestAction,
  });

  await prisma.conversation.update({
    where: { id: live.id },
    data: {
      currentState: completion.currentState,
      nextBestAction: completion.nextBestAction,
      missingInfo: JSON.stringify(completion.missingInformation),
      blockingReason: completion.blockingReason,
      confidence: completion.confidence,
      draftJson: JSON.stringify(completion.draft),
      language: turn.language,
    },
  });

  await prisma.message.create({
    data: { conversationId: live.id, sender: "employee", body: reply },
  });

  await prisma.timelineEvent.create({
    data: {
      businessId: input.ctx.businessId,
      customerId: customer.id,
      conversationId: live.id,
      channel: input.channel.toUpperCase(),
      kind: completion.nextBestAction,
      title: `${input.employeeName}: ${completion.nextBestAction}`,
      detail: completion.reason,
    },
  });

  if (best) {
    const memory = applyFact(parseMemory(customer.memoryJson), {
      field: "product_requested",
      value: best.name,
      source: "CUSTOMER_MESSAGE",
      sourceId: live.id,
    });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { memoryJson: JSON.stringify(memory), language: turn.language },
    });
    await prisma.customerMemoryFact.create({
      data: {
        businessId: input.ctx.businessId,
        customerId: customer.id,
        field: "product_requested",
        value: best.name,
        source: "CUSTOMER_MESSAGE",
        sourceId: live.id,
      },
    });
  }

  try {
    await incrementUsage(input.ctx.businessId, "AI_INTERACTIONS", 1);
  } catch {
    // Entitlement errors are returned by the route if needed; tryout still replies.
  }

  return {
    muted: false,
    conversationId: live.id,
    reply,
    language: turn.language,
    intent: turn.intent,
    currentState: completion.currentState,
    nextBestAction: completion.nextBestAction,
    missingInformation: completion.missingInformation,
    blockingReason: completion.blockingReason,
    reason: completion.reason,
    confidence: completion.confidence,
    escalate: completion.nextBestAction === "ESCALATE_HUMAN",
    voice: turn.voice,
  };
}

async function loadRules(businessId: string): Promise<StoredRule[]> {
  const rows = await prisma.businessRule.findMany({ where: { businessId, enabled: true } });
  return rows.map((row) => ({
    id: row.id,
    ruleType: row.ruleType as StoredRule["ruleType"],
    priority: row.priority,
    condition: parseJson(row.condition, {}),
    action: row.action as StoredRule["action"],
    approvalRequired: row.approvalRequired,
    enabled: row.enabled,
  }));
}
