import { prisma } from "@/lib/prisma";

export type RuleType =
  | "DISCOUNT"
  | "CREDIT"
  | "PAYMENT"
  | "DELIVERY"
  | "RETURN"
  | "ESCALATION"
  | "HOURS"
  | "LANGUAGE"
  | "TONE"
  | "PHRASE";

export type StoredRule = {
  id?: string;
  ruleType: RuleType;
  priority: number;
  condition: Record<string, unknown>;
  action: "ALLOW" | "ESCALATE" | "DENY";
  approvalRequired: boolean;
  enabled: boolean;
};

export type RuleEvaluation = {
  allowed: boolean;
  escalate: boolean;
  reason: string | null;
  matchedRule: StoredRule | null;
};

export const DEFAULT_ELECTRICAL_RULES: StoredRule[] = [
  {
    ruleType: "DISCOUNT",
    priority: 10,
    condition: { maxPercentWithoutApproval: 5 },
    action: "ESCALATE",
    approvalRequired: true,
    enabled: true,
  },
  {
    ruleType: "CREDIT",
    priority: 20,
    condition: { allowWithoutApproval: false },
    action: "ESCALATE",
    approvalRequired: true,
    enabled: true,
  },
  {
    ruleType: "ESCALATION",
    priority: 5,
    condition: {
      reasons: [
        "customer_requests_manager",
        "angry",
        "refund",
        "pricing_exception",
        "credit_exception",
        "inventory_uncertainty",
        "unusual_order",
        "legal",
        "safety",
        "payment_dispute",
        "policy_exception",
      ],
    },
    action: "ESCALATE",
    approvalRequired: true,
    enabled: true,
  },
  {
    ruleType: "PAYMENT",
    priority: 30,
    condition: { collectBeforeDelivery: true },
    action: "DENY",
    approvalRequired: true,
    enabled: true,
  },
  {
    ruleType: "DELIVERY",
    priority: 40,
    condition: { bookOnlyAfterPayment: true },
    action: "DENY",
    approvalRequired: true,
    enabled: true,
  },
  {
    ruleType: "RETURN",
    priority: 50,
    condition: { alwaysEscalate: true },
    action: "ESCALATE",
    approvalRequired: true,
    enabled: true,
  },
  {
    ruleType: "HOURS",
    priority: 60,
    condition: { workOutsideHours: true },
    action: "ALLOW",
    approvalRequired: false,
    enabled: true,
  },
  {
    ruleType: "PHRASE",
    priority: 70,
    condition: { approved: [] },
    action: "ALLOW",
    approvalRequired: false,
    enabled: true,
  },
];

export function evaluateDiscountRule(rules: StoredRule[], requestedPercent: number | undefined): RuleEvaluation {
  if (requestedPercent == null) {
    return { allowed: true, escalate: false, reason: null, matchedRule: null };
  }
  const rule = rules
    .filter((r) => r.enabled && r.ruleType === "DISCOUNT")
    .sort((a, b) => a.priority - b.priority)[0];
  if (!rule) {
    return { allowed: false, escalate: true, reason: "No discount rule — owner must approve", matchedRule: null };
  }
  const max = Number(rule.condition.maxPercentWithoutApproval ?? 0);
  if (requestedPercent > max) {
    return {
      allowed: false,
      escalate: true,
      reason: `Requested ${requestedPercent}% discount. Max without owner approval is ${max}%.`,
      matchedRule: rule,
    };
  }
  return { allowed: true, escalate: false, reason: null, matchedRule: rule };
}

export async function ensureDefaultRules(businessId: string) {
  const existing = await prisma.businessRule.findMany({ where: { businessId } });
  const have = new Set(existing.map((r) => r.ruleType));
  const missing = DEFAULT_ELECTRICAL_RULES.filter((r) => !have.has(r.ruleType));
  if (missing.length === 0) return;
  await prisma.businessRule.createMany({
    data: missing.map((rule) => ({
      businessId,
      ruleType: rule.ruleType,
      priority: rule.priority,
      condition: JSON.stringify(rule.condition),
      action: rule.action,
      approvalRequired: rule.approvalRequired,
      enabled: rule.enabled,
    })),
  });
}

export function evaluateCreditRequest(rules: StoredRule[], requested: boolean): RuleEvaluation {
  if (!requested) return { allowed: true, escalate: false, reason: null, matchedRule: null };
  const rule = rules.find((r) => r.enabled && r.ruleType === "CREDIT");
  if (!rule || rule.condition.allowWithoutApproval !== true) {
    return {
      allowed: false,
      escalate: true,
      reason: "Credit terms need owner approval.",
      matchedRule: rule ?? null,
    };
  }
  return { allowed: true, escalate: false, reason: null, matchedRule: rule };
}
