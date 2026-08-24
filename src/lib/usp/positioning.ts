/**
 * Central product positioning. Import these constants — do not invent
 * marketing or dashboard copy elsewhere.
 */

export const USP_PRIMARY =
  "Don't just answer customers. Complete the sale.";

export const USP_SECONDARY =
  "We measure the money your AI employee makes, not the messages it sends.";

export const USP_DESCRIPTION =
  "An AI employee for Indian businesses that takes a customer from enquiry to recommendation, quotation, order, payment, delivery, follow-up and repeat order — and brings a human in whenever judgment is needed.";

export const USP_PROMISE = "An AI employee that completes the sale.";

export const USP_WORKFLOW = [
  "ENQUIRY",
  "PRODUCT_DISCOVERY",
  "PRODUCT_RECOMMENDATION",
  "PRICE_QUOTE",
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "FOLLOW_UP",
  "REPEAT_ORDER",
] as const;

export const USP_METRICS = {
  primary: "AI_ASSISTED_REVENUE",
  secondary: [
    "AI_ASSISTED_ORDERS",
    "ENQUIRY_TO_ORDER_CONVERSION",
    "ORDER_COMPLETION_RATE",
    "PAYMENT_COMPLETION_RATE",
    "DELIVERY_COMPLETION_RATE",
    "REPEAT_ORDER_RATE",
    "RECOVERED_REVENUE",
    "HUMAN_ESCALATION_RATE",
    "RESPONSE_TIME",
  ],
  neverPrimary: ["MESSAGES_HANDLED", "CONVERSATIONS"],
} as const;

export const PRODUCT_POSITIONING = {
  name: "Aurel",
  hero: USP_PRIMARY,
  subhead:
    "Your AI employee for WhatsApp, phone and daily business operations. It answers customers, recommends products, takes orders, collects payments, coordinates delivery and follows up — while bringing you in whenever human judgment is needed.",
  primaryCta: "Hire your AI employee",
  secondaryCta: "See how it works",
  difference:
    "Answering customers is only the beginning. Completing the business is the job.",
  proof: USP_SECONDARY,
  employeeNotSoftware:
    "You hire an AI employee. You do not configure a chatbot.",
  escalationMarketing: "Your AI employee knows when to ask for help.",
  neverHundredPercentAutomation: true,
  firstLivePath:
    "For a Delhi electrical wholesaler, Rahul takes a WhatsApp enquiry as far toward a paid, delivered order as the business allows.",
} as const;

/** Language we refuse in product UI, onboarding, and marketing. */
export const FORBIDDEN_POSITIONING = [
  "AI chatbot",
  "WhatsApp chatbot",
  "customer support bot",
  "FAQ bot",
  "generic automation",
  "ChatGPT for businesses",
  "configure chatbot",
  "create bot",
  "configure node",
] as const;

export const EMPLOYEE_LANGUAGE = {
  hire: "Hire employee",
  assign: "Assign responsibility",
  giveAccess: "Give employee access",
  setRules: "Set employee rules",
  review: "Review employee work",
  approve: "Approve employee action",
  takeOver: "Take over",
  performance: "Employee performance",
  activity: "Employee activity",
  salary: "Employee salary",
} as const;

export const DEMO_LABEL = "DEMO";

export const ESTIMATE_LABEL = "ESTIMATE";

export const INSUFFICIENT_DATA = "Not enough data.";
