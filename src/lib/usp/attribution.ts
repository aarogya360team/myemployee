export const ATTRIBUTION_ROLES = [
  "DIRECT_HUMAN",
  "AI_ASSISTED",
  "AI_GENERATED",
  "AI_RECOVERED",
  "AI_FOLLOWUP",
  "AI_REACTIVATION",
  "AD_ASSISTED",
  "CAMPAIGN_ASSISTED",
  "ORGANIC_WHATSAPP",
] as const;

export type AttributionRole = (typeof ATTRIBUTION_ROLES)[number];

export type AttributionEvidence = {
  conversationId?: string;
  customerId?: string;
  campaignId?: string;
  adId?: string;
  employeeId?: string;
  orderId?: string;
  timestamps: string[];
  touchpoints: AttributionRole[];
  uncertain: boolean;
};

export const AI_REVENUE_ROLES: AttributionRole[] = [
  "AI_ASSISTED",
  "AI_GENERATED",
  "AI_RECOVERED",
  "AI_FOLLOWUP",
  "AI_REACTIVATION",
];

/**
 * One order, one revenue total. Touchpoints may be many; rupees count once.
 * Uncertain credit is flagged, never forced to 100%.
 */
export function primaryAttribution(touchpoints: AttributionRole[]): {
  role: AttributionRole;
  uncertain: boolean;
} {
  const unique = [...new Set(touchpoints)];
  if (unique.length === 0) return { role: "DIRECT_HUMAN", uncertain: true };
  if (unique.includes("AI_RECOVERED")) return { role: "AI_RECOVERED", uncertain: unique.length > 1 };
  if (unique.includes("AI_GENERATED") && unique.length === 1) {
    return { role: "AI_GENERATED", uncertain: false };
  }
  if (unique.some((role) => AI_REVENUE_ROLES.includes(role))) {
    return { role: "AI_ASSISTED", uncertain: unique.length > 1 };
  }
  if (unique.includes("AD_ASSISTED") || unique.includes("CAMPAIGN_ASSISTED")) {
    return {
      role: unique.includes("AD_ASSISTED") ? "AD_ASSISTED" : "CAMPAIGN_ASSISTED",
      uncertain: unique.length > 1,
    };
  }
  return { role: unique[0] ?? "DIRECT_HUMAN", uncertain: unique.length !== 1 };
}

export function sumRevenueOnce(orders: { id: string; totalPaise: number }[]) {
  const seen = new Set<string>();
  let total = 0;
  for (const order of orders) {
    if (seen.has(order.id)) continue;
    seen.add(order.id);
    total += order.totalPaise;
  }
  return total;
}

export function classifyRevenueBucket(role: AttributionRole, recovered: boolean) {
  if (recovered || role === "AI_RECOVERED") return "AI_RECOVERED_REVENUE" as const;
  if (role === "AI_GENERATED") return "AI_GENERATED_REVENUE" as const;
  if (role === "AD_ASSISTED") return "AI_AD_REVENUE" as const;
  if (role === "CAMPAIGN_ASSISTED") return "AI_MARKETING_REVENUE" as const;
  if (AI_REVENUE_ROLES.includes(role)) return "AI_ASSISTED_REVENUE" as const;
  return "NON_AI_REVENUE" as const;
}

export const ATTRIBUTION_METHODOLOGY = {
  unit: "order",
  rule: "Each order's totalPaise is counted once, on its primary attribution role.",
  uncertain: "MARKED_UNCERTAIN when more than one touchpoint exists or evidence is incomplete. Never assign 100% credit in that case.",
  recovered: "AI_RECOVERED is tracked separately from ordinary AI-assisted revenue.",
};
