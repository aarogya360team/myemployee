/**
 * Capability comparison. Do not fabricate competitor features.
 * Public pages must not name competitor product gaps unless verified.
 */

export const OUR_FOCUS = "CONVERSATION → TRANSACTION → FULFILLMENT → REVENUE";

export const REQUIRED_CAPABILITIES = [
  "product_catalogue_intelligence",
  "customer_specific_pricing",
  "inventory_awareness",
  "quotation_creation",
  "order_creation",
  "payment_collection",
  "invoice_generation",
  "delivery_coordination",
  "customer_follow_up",
  "abandoned_order_recovery",
  "repeat_order_prediction",
  "customer_memory",
  "revenue_attribution",
  "human_escalation",
  "multi_channel_continuity",
] as const;

export type CapabilityId = (typeof REQUIRED_CAPABILITIES)[number];

export type ComparisonColumn =
  | "OUR_PRODUCT"
  | "GENERIC_CHATBOT"
  | "BASIC_WHATSAPP_AI"
  | "CRM"
  | "ERP";

export type CapabilitySupport = "yes" | "partial" | "unknown";

/**
 * Only OUR_PRODUCT is asserted. Other columns stay "unknown"
 * unless a verified source is attached. Never invent competitor gaps.
 */
export const CAPABILITY_MATRIX: Record<
  CapabilityId,
  Record<ComparisonColumn, CapabilitySupport>
> = {
  product_catalogue_intelligence: {
    OUR_PRODUCT: "yes",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  customer_specific_pricing: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  inventory_awareness: {
    OUR_PRODUCT: "yes",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  quotation_creation: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  order_creation: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  payment_collection: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  invoice_generation: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  delivery_coordination: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  customer_follow_up: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  abandoned_order_recovery: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  repeat_order_prediction: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  customer_memory: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  revenue_attribution: {
    OUR_PRODUCT: "yes",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  human_escalation: {
    OUR_PRODUCT: "yes",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
  multi_channel_continuity: {
    OUR_PRODUCT: "partial",
    GENERIC_CHATBOT: "unknown",
    BASIC_WHATSAPP_AI: "unknown",
    CRM: "unknown",
    ERP: "unknown",
  },
};

export const PUBLIC_DIFFERENTIATION =
  "Answering customers is only the beginning. Completing the business is the job.";

export const COMPETITOR_CLASSES = [
  "Meta Business AI",
  "Generic WhatsApp chatbots",
  "WhatsApp automation platforms",
  "CRM chatbots",
  "Tally/Zoho automation",
  "Generic AI agents",
  "AI customer-support tools",
] as const;

export function publicComparisonAllowed(column: ComparisonColumn) {
  if (column === "OUR_PRODUCT") return true;
  return false;
}
