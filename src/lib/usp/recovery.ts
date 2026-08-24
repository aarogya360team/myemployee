import type { TenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";

export const RECOVERY_TYPES = [
  "PRICE_ASKED_THEN_GONE",
  "QUOTE_NOT_ACCEPTED",
  "ORDER_INCOMPLETE",
  "PAYMENT_INCOMPLETE",
  "PROMISED_LATER",
  "NO_REORDER",
  "STOPPED_BUYING_SKU",
  "UNAVAILABLE_INVENTORY",
  "ABANDONED_CONVERSATION",
  "COMPLAINT_NO_RETURN",
] as const;

export type RecoveryType = (typeof RECOVERY_TYPES)[number];

export const RECOVERY_ACTIONS = ["FOLLOW_UP", "REVIEW", "DISMISS"] as const;

export function estimateFromKnownValue(pricePaise?: number, quantity?: number): number | null {
  if (!pricePaise || !quantity || pricePaise <= 0 || quantity <= 0) return null;
  return pricePaise * quantity;
}

export function promisedLater(text: string) {
  return /baad mein|baad me|later|kal soch|phir karunga|kal confirm|next week/i.test(text);
}

export function recoveryTypeFromState(
  state: string,
  flags?: { promisedLater?: boolean; stockShort?: boolean },
): RecoveryType | null {
  if (flags?.promisedLater) return "PROMISED_LATER";
  if (flags?.stockShort) return "UNAVAILABLE_INVENTORY";
  switch (state) {
    case "PRICE_PROVIDED":
    case "PRODUCT_RECOMMENDED":
      return "PRICE_ASKED_THEN_GONE";
    case "QUOTATION_CREATED":
    case "CUSTOMER_INTERESTED":
      return "QUOTE_NOT_ACCEPTED";
    case "ORDER_DRAFT":
      return "ORDER_INCOMPLETE";
    case "PAYMENT_PENDING":
    case "ORDER_CONFIRMED":
      return "PAYMENT_INCOMPLETE";
    case "NEW_ENQUIRY":
    case "PRODUCT_IDENTIFIED":
      return "ABANDONED_CONVERSATION";
    default:
      return null;
  }
}

export async function upsertOpportunity(
  ctx: TenantContext,
  input: {
    customerId?: string | null;
    conversationId?: string | null;
    source: string;
    type: RecoveryType;
    estimatedOrderValuePaise: number | null;
    lastInteractionAt: Date;
  },
) {
  const existing = await prisma.recoveryOpportunity.findFirst({
    where: {
      businessId: ctx.businessId,
      status: "OPEN",
      opportunityType: input.type,
      ...(input.conversationId
        ? { conversationId: input.conversationId }
        : { customerId: input.customerId ?? undefined }),
    },
  });
  if (existing) {
    return prisma.recoveryOpportunity.update({
      where: { id: existing.id },
      data: {
        estimatedOrderValuePaise: input.estimatedOrderValuePaise ?? existing.estimatedOrderValuePaise,
        lastInteractionAt: input.lastInteractionAt,
      },
    });
  }
  return prisma.recoveryOpportunity.create({
    data: {
      businessId: ctx.businessId,
      customerId: input.customerId,
      conversationId: input.conversationId,
      source: input.source,
      opportunityType: input.type,
      estimatedOrderValuePaise: input.estimatedOrderValuePaise,
      lastInteractionAt: input.lastInteractionAt,
      recommendedAction: "FOLLOW_UP",
      status: "OPEN",
    },
  });
}

export async function markOpportunityRecovered(
  ctx: TenantContext,
  opts: { conversationId?: string | null; customerId?: string | null; valuePaise: number },
) {
  const filters = [
    opts.conversationId ? { conversationId: opts.conversationId } : null,
    opts.customerId ? { customerId: opts.customerId } : null,
  ].filter(Boolean) as { conversationId?: string; customerId?: string }[];
  if (filters.length === 0) return null;
  const row = await prisma.recoveryOpportunity.findFirst({
    where: { businessId: ctx.businessId, status: "OPEN", OR: filters },
  });
  if (!row) return null;
  return prisma.recoveryOpportunity.update({
    where: { id: row.id },
    data: {
      status: "RECOVERED",
      recovered: true,
      recoveredValuePaise: opts.valuePaise,
    },
  });
}
