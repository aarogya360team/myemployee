import type { PlanCode } from "@/lib/billing/catalog";
import type { VerticalCode } from "./verticals";

export type WorkforceTemplate = {
  key: "RAHUL" | "PRIYA" | "AMIT" | "NEHA";
  name: string;
  role: string;
  title: string;
  responsibilities: string[];
  supportedActions: string[];
  requiredIntegrations: string[];
  minPlan: PlanCode;
  kpis: string[];
  recommended: boolean;
};

export const WORKFORCE_TEMPLATES: WorkforceTemplate[] = [
  {
    key: "RAHUL",
    name: "Rahul",
    role: "SALES",
    title: "AI Sales Employee",
    responsibilities: [
      "Take WhatsApp and phone enquiries to a quote or order",
      "Recommend from the shop catalogue",
      "Escalate when price, credit, or stock needs a human",
    ],
    supportedActions: [
      "ASK_PRODUCT_CLARIFICATION",
      "CHECK_INVENTORY",
      "PROVIDE_PRICE",
      "CREATE_QUOTE",
      "CREATE_ORDER",
      "ESCALATE_HUMAN",
    ],
    requiredIntegrations: ["catalogue"],
    minPlan: "STARTER",
    kpis: ["AI_ASSISTED_REVENUE", "ENQUIRY_TO_ORDER_CONVERSION", "HUMAN_ESCALATION_RATE"],
    recommended: true,
  },
  {
    key: "PRIYA",
    name: "Priya",
    role: "MARKETING",
    title: "AI Marketing Employee",
    responsibilities: ["Reactivate quiet customers", "Follow up quotes", "Campaigns when the plan allows"],
    supportedActions: ["FOLLOW_UP", "REORDER_FOLLOWUP", "REACTIVATE_CUSTOMER"],
    requiredIntegrations: ["whatsapp"],
    minPlan: "GROWTH",
    kpis: ["AI_RECOVERED_REVENUE", "REPEAT_ORDER_RATE"],
    recommended: false,
  },
  {
    key: "AMIT",
    name: "Amit",
    role: "DELIVERY",
    title: "AI Orders & Delivery Employee",
    responsibilities: ["Book delivery after payment", "Track fulfillment", "Escalate failed deliveries"],
    supportedActions: ["START_FULFILLMENT", "BOOK_DELIVERY"],
    requiredIntegrations: ["delivery"],
    minPlan: "BUSINESS",
    kpis: ["DELIVERY_COMPLETION_RATE", "ORDER_COMPLETION_RATE"],
    recommended: false,
  },
  {
    key: "NEHA",
    name: "Neha",
    role: "ACCOUNTS",
    title: "AI Payments Employee",
    responsibilities: ["Request payment", "Match receipts", "Escalate payment disputes"],
    supportedActions: ["REQUEST_PAYMENT"],
    requiredIntegrations: ["payments"],
    minPlan: "BUSINESS",
    kpis: ["PAYMENT_COMPLETION_RATE", "AI_ASSISTED_REVENUE"],
    recommended: false,
  },
];

const PLAN_TIER: Record<string, number> = {
  STARTER: 1,
  BUSINESS: 2,
  PERFORMANCE: 2,
  GROWTH: 3,
  PRO: 4,
};

export function planAllowsHire(planCode: string, template: WorkforceTemplate) {
  return (PLAN_TIER[planCode] ?? 0) >= (PLAN_TIER[template.minPlan] ?? 99);
}

export function recommendWorkforce(vertical: VerticalCode): WorkforceTemplate[] {
  const rahul = WORKFORCE_TEMPLATES.find((t) => t.key === "RAHUL")!;
  const amit = WORKFORCE_TEMPLATES.find((t) => t.key === "AMIT")!;
  const neha = WORKFORCE_TEMPLATES.find((t) => t.key === "NEHA")!;
  const priya = WORKFORCE_TEMPLATES.find((t) => t.key === "PRIYA")!;

  if (vertical === "ELECTRICAL_WHOLESALER" || vertical === "HARDWARE" || vertical === "DISTRIBUTOR") {
    return [
      { ...rahul, recommended: true },
      { ...amit, recommended: true },
      { ...neha, recommended: false },
      { ...priya, recommended: false },
    ];
  }
  if (vertical === "GARMENTS") {
    return [
      { ...rahul, recommended: true },
      { ...priya, recommended: true },
      { ...amit, recommended: false },
      { ...neha, recommended: false },
    ];
  }
  return WORKFORCE_TEMPLATES.map((t) => ({ ...t, recommended: t.key === "RAHUL" }));
}
