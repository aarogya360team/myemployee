/** Commercial catalog. UI must read this (or Plan rows seeded from it) — never invent prices. */
export const FEATURES = [
  "AI_CUSTOMER_SERVICE",
  "AI_SALES",
  "PRODUCT_SEARCH",
  "ORDER_MANAGEMENT",
  "INVOICE",
  "PAYMENTS",
  "DELIVERY",
  "FOLLOWUPS",
  "CUSTOMER_CRM",
  "ESCALATIONS",
  "ANALYTICS",
  "VOICE",
  "OUTBOUND_CALLS",
  "MARKETING",
  "CAMPAIGNS",
  "META_ADS",
  "GOOGLE_ADS",
  "ATTRIBUTION",
  "MULTI_EMPLOYEE",
  "MULTI_BRANCH",
  "API_ACCESS",
  "ADVANCED_ANALYTICS",
  "PRIORITY_SUPPORT",
] as const;

export type FeatureCode = (typeof FEATURES)[number];

export type PlanCode = "STARTER" | "BUSINESS" | "GROWTH" | "PRO" | "PERFORMANCE";

export type PlanSpec = {
  code: PlanCode;
  name: string;
  tagline: string;
  monthlyPaise: number;
  annualPaise: number;
  trialDays: number;
  popular: boolean;
  sortOrder: number;
  features: FeatureCode[];
  limits: Record<string, number>;
};

const starterFeatures: FeatureCode[] = [
  "AI_CUSTOMER_SERVICE",
  "PRODUCT_SEARCH",
  "CUSTOMER_CRM",
  "ESCALATIONS",
];

const businessFeatures: FeatureCode[] = [
  ...starterFeatures,
  "AI_SALES",
  "ORDER_MANAGEMENT",
  "INVOICE",
  "PAYMENTS",
  "DELIVERY",
  "FOLLOWUPS",
  "ANALYTICS",
  "ATTRIBUTION",
];

const growthFeatures: FeatureCode[] = [
  ...businessFeatures,
  "VOICE",
  "OUTBOUND_CALLS",
  "MARKETING",
  "CAMPAIGNS",
  "META_ADS",
  "GOOGLE_ADS",
  "MULTI_EMPLOYEE",
];

const proFeatures: FeatureCode[] = [
  ...growthFeatures,
  "MULTI_EMPLOYEE",
  "MULTI_BRANCH",
  "API_ACCESS",
  "ADVANCED_ANALYTICS",
  "PRIORITY_SUPPORT",
];

export const PLAN_CATALOG: PlanSpec[] = [
  {
    code: "STARTER",
    name: "Starter",
    tagline: "Hire Rahul — complete WhatsApp enquiries toward an order",
    monthlyPaise: 149900,
    annualPaise: 149900 * 10,
    trialDays: 14,
    popular: false,
    sortOrder: 1,
    features: starterFeatures,
    limits: {
      AI_INTERACTIONS: 1000,
      VOICE_MINUTES: 0,
      CUSTOMERS: 100,
      PRODUCTS: 250,
      EMPLOYEES: 1,
      WHATSAPP_NUMBERS: 1,
      BRANCHES: 1,
      CAMPAIGNS: 0,
    },
  },
  {
    code: "BUSINESS",
    name: "Business",
    tagline: "Rahul completes the sale — quote, order, payment, delivery",
    monthlyPaise: 349900,
    annualPaise: 349900 * 10,
    trialDays: 14,
    popular: true,
    sortOrder: 2,
    features: businessFeatures,
    limits: {
      AI_INTERACTIONS: 5000,
      VOICE_MINUTES: 0,
      CUSTOMERS: 1000,
      PRODUCTS: 5000,
      EMPLOYEES: 1,
      WHATSAPP_NUMBERS: 1,
      BRANCHES: 1,
      CAMPAIGNS: 0,
    },
  },
  {
    code: "GROWTH",
    name: "Growth",
    tagline: "Rahul + Marketing + Voice",
    monthlyPaise: 599900,
    annualPaise: 599900 * 10,
    trialDays: 14,
    popular: false,
    sortOrder: 3,
    features: growthFeatures,
    limits: {
      AI_INTERACTIONS: 10000,
      VOICE_MINUTES: 250,
      CUSTOMERS: 5000,
      PRODUCTS: 25000,
      EMPLOYEES: 2,
      WHATSAPP_NUMBERS: 1,
      BRANCHES: 1,
      CAMPAIGNS: 20,
    },
  },
  {
    code: "PRO",
    name: "Pro",
    tagline: "Build your AI workforce",
    monthlyPaise: 999900,
    annualPaise: 999900 * 10,
    trialDays: 14,
    popular: false,
    sortOrder: 4,
    features: proFeatures,
    limits: {
      AI_INTERACTIONS: 50000,
      VOICE_MINUTES: 1000,
      CUSTOMERS: 25000,
      PRODUCTS: 100000,
      EMPLOYEES: 8,
      WHATSAPP_NUMBERS: 5,
      BRANCHES: 10,
      CAMPAIGNS: 100,
    },
  },
  {
    code: "PERFORMANCE",
    name: "Performance",
    tagline: "₹1,999 + 0.25% of AI-assisted order value",
    monthlyPaise: 199900,
    annualPaise: 199900 * 10,
    trialDays: 14,
    popular: false,
    sortOrder: 5,
    features: businessFeatures,
    limits: {
      AI_INTERACTIONS: 5000,
      VOICE_MINUTES: 0,
      CUSTOMERS: 1000,
      PRODUCTS: 5000,
      EMPLOYEES: 1,
      WHATSAPP_NUMBERS: 1,
      BRANCHES: 1,
      CAMPAIGNS: 0,
    },
  },
];

export const ADDON_CATALOG = [
  { code: "VOICE_100_MIN", name: "100 voice minutes", description: "Extra inbound/outbound minutes", monthlyPaise: 49900, requiresFeature: "VOICE", metric: "VOICE_MINUTES", amount: 100 },
  { code: "VOICE_500_MIN", name: "500 voice minutes", description: "High-volume calling", monthlyPaise: 199900, requiresFeature: "VOICE", metric: "VOICE_MINUTES", amount: 500 },
  { code: "EXTRA_AI_INTERACTIONS_5000", name: "5,000 extra replies", description: "More AI conversations", monthlyPaise: 99900, requiresFeature: null, metric: "AI_INTERACTIONS", amount: 5000 },
  { code: "EXTRA_CUSTOMERS_5000", name: "5,000 extra customers", description: "Bigger customer book", monthlyPaise: 79900, requiresFeature: null, metric: "CUSTOMERS", amount: 5000 },
  { code: "EXTRA_PRODUCTS_10000", name: "10,000 extra products", description: "Larger catalogue", monthlyPaise: 79900, requiresFeature: null, metric: "PRODUCTS", amount: 10000 },
  { code: "EXTRA_WHATSAPP_NUMBER", name: "Extra WhatsApp number", description: "Another business number", monthlyPaise: 149900, requiresFeature: null, metric: "WHATSAPP_NUMBERS", amount: 1 },
  { code: "EXTRA_AI_EMPLOYEE", name: "Extra AI employee", description: "Add Priya, Amit or Neha", monthlyPaise: 199900, requiresFeature: "MULTI_EMPLOYEE", metric: "EMPLOYEES", amount: 1 },
  { code: "META_ADS", name: "Meta Ads", description: "Click-to-WhatsApp attribution", monthlyPaise: 149900, requiresFeature: "META_ADS", metric: null, amount: null },
  { code: "GOOGLE_ADS", name: "Google Ads", description: "Search ad attribution", monthlyPaise: 149900, requiresFeature: "GOOGLE_ADS", metric: null, amount: null },
  { code: "ADVANCED_ANALYTICS", name: "Advanced analytics", description: "Deeper ROI and cohorts", monthlyPaise: 99900, requiresFeature: "ADVANCED_ANALYTICS", metric: null, amount: null },
  { code: "API_ACCESS", name: "API access", description: "Connect your own systems", monthlyPaise: 249900, requiresFeature: "API_ACCESS", metric: null, amount: null },
  { code: "PRIORITY_SUPPORT", name: "Priority support", description: "Faster human help", monthlyPaise: 49900, requiresFeature: "PRIORITY_SUPPORT", metric: null, amount: null },
];

export const WORKFORCE = [
  { role: "SALES", name: "Rahul", title: "Sales & Customer Service", minPlan: "STARTER" as PlanCode },
  { role: "MARKETING", name: "Priya", title: "Marketing & Reactivation", minPlan: "GROWTH" as PlanCode },
  { role: "DELIVERY", name: "Amit", title: "Delivery Coordinator", minPlan: "BUSINESS" as PlanCode },
  { role: "ACCOUNTS", name: "Neha", title: "Accounts & Payments", minPlan: "BUSINESS" as PlanCode },
];

export function formatInr(paise: number) {
  const n = Math.round(paise / 100);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toString();
  if (abs.length <= 3) return `${sign}₹${abs}`;
  const last3 = abs.slice(-3);
  const rest = abs.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}₹${rest},${last3}`;
}
