export const ESCALATION_PRIORITIES = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;
export type EscalationPriority = (typeof ESCALATION_PRIORITIES)[number];

export const ESCALATION_REASONS = [
  "low_confidence",
  "customer_requests_manager",
  "angry",
  "refund_dispute",
  "pricing_exception",
  "credit_exception",
  "inventory_uncertainty",
  "unusual_order",
  "legal",
  "safety",
  "payment_dispute",
  "policy_exception",
] as const;

export type EscalationReason = (typeof ESCALATION_REASONS)[number];

export type HandoffInput = {
  customerName?: string | null;
  requestedQty?: number;
  productName?: string;
  inventory?: number;
  specialPricing?: boolean;
  lastOrderLabel?: string;
  reason: string;
};

export function escalationPriority(reason: string, qty?: number): EscalationPriority {
  if (["legal", "safety", "angry", "refund_dispute", "payment_dispute"].includes(reason)) {
    return "URGENT";
  }
  if (["pricing_exception", "credit_exception", "inventory_uncertainty"].includes(reason)) {
    return "HIGH";
  }
  if (qty && qty >= 200) return "HIGH";
  if (reason === "low_confidence") return "NORMAL";
  return "NORMAL";
}

export function buildHandoffSummary(input: HandoffInput) {
  const lines = [
    input.customerName ? `Customer: ${input.customerName}.` : "Customer: unknown (not matched).",
    input.requestedQty != null ? `Wants ${input.requestedQty} units${input.productName ? ` of ${input.productName}` : ""}.` : null,
    input.inventory != null ? `Current inventory: ${input.inventory}.` : null,
    input.specialPricing ? "Customer has requested special pricing." : null,
    input.lastOrderLabel ? `Last order: ${input.lastOrderLabel}.` : null,
    `Reason: ${input.reason}.`,
  ].filter(Boolean);
  const recommended = input.specialPricing
    ? "Recommended: owner approval."
    : input.inventory != null && input.requestedQty != null && input.inventory < input.requestedQty
      ? "Recommended: owner decides allocation or alternate SKU."
      : "Recommended: owner review before the AI continues.";
  return { summary: lines.join(" "), recommendedAction: recommended };
}

export function looksAngry(text: string) {
  return /gussa|angry|bekaar|fraud|cheat|bakwas|useless|complaint|manager se|owner se baat/i.test(
    text,
  );
}

export function requestsManager(text: string) {
  return /manager|owner|malik|incharge|senior|real person se/i.test(text);
}

export function requestsCredit(text: string) {
  return /udhaar|credit|udhar|baad mein paise|15 din|30 din/i.test(text);
}
