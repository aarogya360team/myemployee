import type { CustomerIntent } from "@/lib/language/intent";
import { orderCompleteness, type OrderDraft } from "@/lib/engines/completeness";

export const JOURNEY_STATES = [
  "NEW_ENQUIRY",
  "PRODUCT_IDENTIFIED",
  "PRODUCT_RECOMMENDED",
  "PRICE_PROVIDED",
  "CUSTOMER_INTERESTED",
  "QUOTATION_CREATED",
  "ORDER_DRAFT",
  "ORDER_CONFIRMED",
  "PAYMENT_PENDING",
  "PAYMENT_RECEIVED",
  "FULFILLMENT_PENDING",
  "DELIVERY_BOOKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FOLLOWUP_PENDING",
  "REPEAT_ORDER_OPPORTUNITY",
  "CANCELLED",
  "REJECTED",
  "ESCALATED",
  "HUMAN_HANDLED",
  "FAILED",
] as const;

export type JourneyState = (typeof JOURNEY_STATES)[number];

export const NEXT_BEST_ACTIONS = [
  "ASK_PRODUCT_CLARIFICATION",
  "CHECK_INVENTORY",
  "PROVIDE_PRICE",
  "CHECK_CUSTOMER_PRICE",
  "CREATE_QUOTE",
  "CREATE_ORDER",
  "REQUEST_PAYMENT",
  "START_FULFILLMENT",
  "BOOK_DELIVERY",
  "FOLLOW_UP",
  "REQUEST_FEEDBACK",
  "REORDER_FOLLOWUP",
  "REACTIVATE_CUSTOMER",
  "ESCALATE_HUMAN",
] as const;

export type NextBestAction = (typeof NEXT_BEST_ACTIONS)[number];

export type JourneyDraft = OrderDraft & {
  productName?: string;
  pricePaise?: number;
  stock?: number;
  stallCount?: number;
  lastAction?: NextBestAction;
  promisedLater?: boolean;
  stockShort?: boolean;
  identityUnconfirmed?: boolean;
};

export type CompletionInput = {
  currentState: JourneyState;
  intent: CustomerIntent;
  text: string;
  draft: JourneyDraft;
  productConfidence: number;
  productFound: boolean;
  stockKnown: boolean;
  stockOk?: boolean;
  priceKnown: boolean;
  escalateForced?: boolean;
  escalateReason?: string;
  orderStatus?: string | null;
  paymentStatus?: string | null;
  deliveryStatus?: string | null;
};

export type CompletionResult = {
  currentState: JourneyState;
  nextBestAction: NextBestAction;
  missingInformation: string[];
  blockingReason: string | null;
  responsibleEmployee: "AI" | "HUMAN";
  confidence: number;
  reason: string;
  draft: JourneyDraft;
};

const TERMINAL: JourneyState[] = [
  "CANCELLED",
  "REJECTED",
  "ESCALATED",
  "HUMAN_HANDLED",
  "FAILED",
];

export function parseQuantity(text: string): number | undefined {
  const withUnit = text.match(/(\d+)\s*(?:pieces?|pcs\b|pc\b|qty|quantity|box|carton|dozen)\b/i);
  if (withUnit) {
    const n = Number(withUnit[1]);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const chahiye = text.match(/(\d+)\s*(?:pieces?|pcs)?\s*chahiye/i);
  if (chahiye) {
    const n = Number(chahiye[1]);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
}

export function parseDiscountPercent(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:%|percent|discount)/i);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

function missingFromDraft(draft: JourneyDraft): string[] {
  return orderCompleteness(draft).missing;
}

export function nextBestAction(input: CompletionInput): CompletionResult {
  const qty = parseQuantity(input.text) ?? input.draft.quantity;
  const draft: JourneyDraft = {
    ...input.draft,
    quantity: qty,
    stallCount: input.intent === "other" ? (input.draft.stallCount ?? 0) + 1 : 0,
  };

  if (input.escalateForced) {
    return result({
      currentState: "ESCALATED",
      nextBestAction: "ESCALATE_HUMAN",
      missingInformation: missingFromDraft(draft),
      blockingReason: input.escalateReason ?? "Needs owner judgment",
      responsibleEmployee: "HUMAN",
      confidence: 0.9,
      reason: input.escalateReason ?? "Policy or customer requested a human",
      draft,
    });
  }

  if (input.intent === "refund" || input.intent === "complaint") {
    return result({
      currentState: "ESCALATED",
      nextBestAction: "ESCALATE_HUMAN",
      missingInformation: missingFromDraft(draft),
      blockingReason: input.intent === "refund" ? "Refund dispute" : "Complaint",
      responsibleEmployee: "HUMAN",
      confidence: 0.92,
      reason: "Refunds and complaints are owner work, not endless chat",
      draft,
    });
  }

  if (input.intent === "confirm_no") {
    return result({
      currentState: "REJECTED",
      nextBestAction: "ASK_PRODUCT_CLARIFICATION",
      missingInformation: ["product"],
      blockingReason: "Customer declined",
      responsibleEmployee: "AI",
      confidence: 0.8,
      reason: "Customer said no — reset to a clear product ask",
      draft: { stallCount: 0 },
    });
  }

  if (input.deliveryStatus === "DELIVERED" || input.currentState === "DELIVERED") {
    return result({
      currentState: "FOLLOWUP_PENDING",
      nextBestAction: "REQUEST_FEEDBACK",
      missingInformation: [],
      blockingReason: null,
      responsibleEmployee: "AI",
      confidence: 0.85,
      reason: "Order delivered — ask for feedback, then watch for reorder",
      draft,
    });
  }

  if (input.paymentStatus === "paid" || input.currentState === "PAYMENT_RECEIVED") {
    return result({
      currentState: "FULFILLMENT_PENDING",
      nextBestAction: "START_FULFILLMENT",
      missingInformation: draft.address ? [] : ["delivery_address"],
      blockingReason: draft.address ? null : "Need delivery address before booking",
      responsibleEmployee: "AI",
      confidence: 0.88,
      reason: "Payment received — start fulfillment",
      draft,
    });
  }

  if (input.orderStatus === "CONFIRMED" || input.currentState === "ORDER_CONFIRMED") {
    return result({
      currentState: "PAYMENT_PENDING",
      nextBestAction: "REQUEST_PAYMENT",
      missingInformation: [],
      blockingReason: "Payment not received",
      responsibleEmployee: "AI",
      confidence: 0.86,
      reason: "Order exists but payment is missing",
      draft,
    });
  }

  if (input.intent === "address" && input.text.trim().length > 8) {
    draft.address = input.text.trim();
  }

  if (input.productFound && input.productConfidence >= 0.35) {
    if (input.intent === "stock" || (input.stockKnown && input.stockOk === false)) {
      return result({
        currentState: "PRODUCT_IDENTIFIED",
        nextBestAction: "CHECK_INVENTORY",
        missingInformation: missingFromDraft(draft).filter((m) => m !== "product"),
        blockingReason: input.stockOk === false ? "Inventory short" : null,
        responsibleEmployee: input.stockOk === false ? "HUMAN" : "AI",
        confidence: Math.min(input.productConfidence, 0.9),
        reason: "Customer asked availability — check stock before promising",
        draft,
      });
    }

    if (input.intent === "price" || input.priceKnown) {
      const afterPrice: JourneyState = qty ? "CUSTOMER_INTERESTED" : "PRICE_PROVIDED";
      const next: NextBestAction = qty
        ? input.stockOk === false
          ? "ESCALATE_HUMAN"
          : "CREATE_QUOTE"
        : "PROVIDE_PRICE";
      return result({
        currentState: afterPrice,
        nextBestAction: next,
        missingInformation: missingFromDraft(draft).filter((m) => m !== "product"),
        blockingReason: input.priceKnown ? null : "Price must come from catalogue",
        responsibleEmployee: "AI",
        confidence: input.priceKnown ? 0.84 : 0.55,
        reason: qty
          ? "Price and quantity known — create a quote, do not keep chatting"
          : "Verified catalogue price — ask quantity next",
        draft,
      });
    }

    if (input.intent === "quantity" || qty) {
      const completeness = orderCompleteness(draft);
      const next: NextBestAction = completeness.complete
        ? "CREATE_ORDER"
        : completeness.missing.includes("delivery_address")
          ? "CREATE_QUOTE"
          : "CREATE_QUOTE";
      return result({
        currentState: completeness.complete ? "ORDER_DRAFT" : "CUSTOMER_INTERESTED",
        nextBestAction: next,
        missingInformation: completeness.missing,
        blockingReason: completeness.complete ? null : completeness.missing[0] ?? null,
        responsibleEmployee: "AI",
        confidence: 0.78,
        reason: "Quantity given — move to quote/order, ask only what is missing",
        draft,
      });
    }

    if (input.intent === "confirm_yes") {
      const completeness = orderCompleteness(draft);
      if (["PRICE_PROVIDED", "CUSTOMER_INTERESTED", "QUOTATION_CREATED", "ORDER_DRAFT"].includes(input.currentState)) {
        return result({
          currentState: completeness.complete ? "ORDER_DRAFT" : "QUOTATION_CREATED",
          nextBestAction: completeness.complete ? "CREATE_ORDER" : "CREATE_QUOTE",
          missingInformation: completeness.missing,
          blockingReason: completeness.complete ? null : completeness.missing[0] ?? null,
          responsibleEmployee: "AI",
          confidence: 0.82,
          reason: "Customer said yes — create the order or quote, do not only reply",
          draft,
        });
      }
    }

    return result({
      currentState: "PRODUCT_IDENTIFIED",
      nextBestAction: "CHECK_CUSTOMER_PRICE",
      missingInformation: missingFromDraft(draft).filter((m) => m !== "product"),
      blockingReason: null,
      responsibleEmployee: "AI",
      confidence: input.productConfidence,
      reason: "Product identified — give the customer-specific price from records",
      draft,
    });
  }

  if (input.intent === "price" || input.intent === "stock" || input.intent === "quantity") {
    return result({
      currentState: "NEW_ENQUIRY",
      nextBestAction: "ASK_PRODUCT_CLARIFICATION",
      missingInformation: ["product", ...missingFromDraft(draft).filter((m) => m !== "product")],
      blockingReason: "Product not identified from catalogue",
      responsibleEmployee: "AI",
      confidence: 0.7,
      reason: "Cannot quote or book without a catalogue match — ask brand/watt/size",
      draft,
    });
  }

  if ((draft.stallCount ?? 0) >= 2) {
    return result({
      currentState: input.currentState,
      nextBestAction: "ASK_PRODUCT_CLARIFICATION",
      missingInformation: missingFromDraft(draft),
      blockingReason: "Conversation not progressing the sale",
      responsibleEmployee: "AI",
      confidence: 0.6,
      reason: "Do not chat endlessly — pull the enquiry back to a product and quantity",
      draft,
    });
  }

  if (TERMINAL.includes(input.currentState)) {
    return result({
      currentState: input.currentState,
      nextBestAction: "FOLLOW_UP",
      missingInformation: missingFromDraft(draft),
      blockingReason: input.currentState,
      responsibleEmployee: input.currentState === "ESCALATED" ? "HUMAN" : "AI",
      confidence: 0.5,
      reason: "Journey is in a held state",
      draft,
    });
  }

  return result({
    currentState: input.currentState === "NEW_ENQUIRY" ? "NEW_ENQUIRY" : input.currentState,
    nextBestAction: "ASK_PRODUCT_CLARIFICATION",
    missingInformation: missingFromDraft(draft).length ? missingFromDraft(draft) : ["product"],
    blockingReason: null,
    responsibleEmployee: "AI",
    confidence: 0.45,
    reason: "Need a product to move the business journey forward",
    draft,
  });
}

function result(value: CompletionResult): CompletionResult {
  return { ...value, draft: { ...value.draft, lastAction: value.nextBestAction } };
}

export function isProgressingAction(action: NextBestAction) {
  return action !== "ASK_PRODUCT_CLARIFICATION" || true;
}
