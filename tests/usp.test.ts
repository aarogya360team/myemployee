import assert from "node:assert/strict";
import { test } from "node:test";
import { primaryAttribution, sumRevenueOnce } from "../src/lib/usp/attribution";
import { nextBestAction, parseQuantity } from "../src/lib/usp/completion";
import { FORBIDDEN_POSITIONING, PRODUCT_POSITIONING, USP_METRICS, USP_PRIMARY } from "../src/lib/usp/positioning";
import { calculateRoi, ROI_DISCLAIMER } from "../src/lib/usp/roi";
import { evaluateDiscountRule, DEFAULT_ELECTRICAL_RULES } from "../src/lib/usp/rules";
import { VERTICAL_PROFILES } from "../src/lib/usp/verticals";
import { estimateFromKnownValue, promisedLater, recoveryTypeFromState } from "../src/lib/usp/recovery";
import { scoreEmployee } from "../src/lib/usp/scorecard";
import { canBookDelivery } from "../src/lib/usp/fulfillment";
import { mockPayments } from "../src/lib/providers/mocks";
import { planAllowsHire, WORKFORCE_TEMPLATES } from "../src/lib/usp/workforce";
import { applyFact, emptyMemory, rebuildMemory } from "../src/lib/usp/memory";

test("quantity parser does not treat watt as pieces", () => {
  assert.equal(parseQuantity("Bhai woh 12 watt ke Philips bulb ka rate kya hai?"), undefined);
  assert.equal(parseQuantity("100 pieces chahiye"), 100);
  assert.equal(parseQuantity("50 pcs"), 50);
});

test("without a catalogue match the next action is clarification, not a fake price", () => {
  const result = nextBestAction({
    currentState: "NEW_ENQUIRY",
    intent: "price",
    text: "12 watt philips ka rate?",
    draft: {},
    productConfidence: 0,
    productFound: false,
    stockKnown: false,
    priceKnown: false,
  });
  assert.equal(result.nextBestAction, "ASK_PRODUCT_CLARIFICATION");
  assert.equal(result.currentState, "NEW_ENQUIRY");
});

test("verified product + price intent moves the journey forward", () => {
  const result = nextBestAction({
    currentState: "NEW_ENQUIRY",
    intent: "price",
    text: "12 watt philips ka rate?",
    draft: { productSku: "PH-LED-12W-B22", productName: "Philips 12W B22 LED bulb" },
    productConfidence: 0.9,
    productFound: true,
    stockKnown: true,
    stockOk: true,
    priceKnown: true,
  });
  assert.equal(result.nextBestAction, "PROVIDE_PRICE");
  assert.equal(result.currentState, "PRICE_PROVIDED");
});

test("address after a quote creates the order when the draft is complete", () => {
  const result = nextBestAction({
    currentState: "QUOTATION_CREATED",
    intent: "address",
    text: "Delivery Karol Bagh, Delhi 110005",
    draft: {
      productSku: "PH-LED-12W-B22",
      productName: "Philips 12W",
      quantity: 50,
      customerPhone: "9999900011",
    },
    productConfidence: 0.9,
    productFound: true,
    stockKnown: true,
    stockOk: true,
    priceKnown: true,
  });
  assert.equal(result.nextBestAction, "CREATE_ORDER");
  assert.ok(result.draft.address);
  assert.equal(result.draft.deliveryMethod, "courier");
});

test("provider-paid status starts fulfillment instead of chatting", () => {
  const result = nextBestAction({
    currentState: "PAYMENT_PENDING",
    intent: "payment_done",
    text: "Maine pay kar diya",
    draft: {
      productSku: "PH-LED-12W-B22",
      quantity: 50,
      address: "Karol Bagh, Delhi 110005",
      customerPhone: "9999900011",
    },
    productConfidence: 0.9,
    productFound: true,
    stockKnown: true,
    stockOk: true,
    priceKnown: true,
    paymentStatus: "paid",
  });
  assert.equal(result.nextBestAction, "START_FULFILLMENT");
});

test("customer saying paid does not mark paid without the provider", () => {
  const result = nextBestAction({
    currentState: "PAYMENT_PENDING",
    intent: "payment_done",
    text: "Maine pay kar diya",
    draft: { productSku: "PH-LED-12W-B22", quantity: 50, address: "Karol Bagh" },
    productConfidence: 0.9,
    productFound: true,
    stockKnown: true,
    stockOk: true,
    priceKnown: true,
    paymentStatus: "pending",
  });
  assert.equal(result.nextBestAction, "REQUEST_PAYMENT");
});

test("quantity after price creates a quote instead of endless chat", () => {
  const result = nextBestAction({
    currentState: "PRICE_PROVIDED",
    intent: "quantity",
    text: "100 pieces chahiye",
    draft: {
      productSku: "PH-LED-12W-B22",
      productName: "Philips 12W B22",
      pricePaise: 8500,
      quantity: 100,
    },
    productConfidence: 0.9,
    productFound: true,
    stockKnown: true,
    stockOk: true,
    priceKnown: true,
  });
  assert.equal(result.nextBestAction, "CREATE_QUOTE");
});

test("discount above 5% must escalate", () => {
  const ev = evaluateDiscountRule(DEFAULT_ELECTRICAL_RULES, 10);
  assert.equal(ev.escalate, true);
  assert.equal(ev.allowed, false);
  const ok = evaluateDiscountRule(DEFAULT_ELECTRICAL_RULES, 5);
  assert.equal(ok.escalate, false);
});

test("revenue is counted once even with many touchpoints", () => {
  const total = sumRevenueOnce([
    { id: "o1", totalPaise: 10000 },
    { id: "o1", totalPaise: 10000 },
    { id: "o2", totalPaise: 5000 },
  ]);
  assert.equal(total, 15000);
  const attr = primaryAttribution(["AI_ASSISTED", "CAMPAIGN_ASSISTED"]);
  assert.equal(attr.role, "AI_ASSISTED");
  assert.equal(attr.uncertain, true);
});

test("recovery estimate is null without a real price and qty", () => {
  assert.equal(estimateFromKnownValue(undefined, 10), null);
  assert.equal(estimateFromKnownValue(8500, 100), 850000);
});

test("scorecard refuses fake scores", () => {
  const card = scoreEmployee({
    events: 1,
    components: {
      responseSpeed: null,
      enquiryConversion: null,
      orderCompletion: null,
      paymentCompletion: null,
      deliveryCompletion: null,
      followUpSuccess: null,
      customerSatisfaction: null,
      escalationQuality: null,
      humanTakeoverRate: null,
    },
    revenueAssistedPaise: 0,
    revenueRecoveredPaise: 0,
  });
  assert.equal(card.enoughData, false);
  assert.equal(card.score, null);
});

test("ROI calculator is labeled an estimate", () => {
  const roi = calculateRoi({
    monthlyEnquiries: 1000,
    averageOrderValuePaise: 500000,
    currentConversionRate: 0.08,
    estimatedConversionRate: 0.12,
    employeeCostPaise: 349900,
  });
  assert.equal(roi.label, "ESTIMATE");
  assert.equal(roi.additionalRevenuePaise, 20_000_000);
  assert.match(ROI_DISCLAIMER, /Illustrative/);
});

test("positioning forbids chatbot framing and measures money", () => {
  assert.match(USP_PRIMARY, /Complete the sale/i);
  assert.equal(USP_METRICS.primary, "AI_ASSISTED_REVENUE");
  assert.ok(!(USP_METRICS.neverPrimary as readonly string[]).includes("AI_ASSISTED_REVENUE"));
  const blob = `${PRODUCT_POSITIONING.hero} ${PRODUCT_POSITIONING.subhead} ${PRODUCT_POSITIONING.difference}`;
  for (const phrase of FORBIDDEN_POSITIONING) {
    assert.doesNotMatch(blob.toLowerCase(), new RegExp(phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("electrical vertical keeps units configurable, not invented prices", () => {
  const profile = VERTICAL_PROFILES.ELECTRICAL_WHOLESALER;
  assert.ok(profile.units.includes("pcs"));
  assert.ok(profile.terminology.includes("B22"));
});

test("promised later becomes PROMISED_LATER recovery, not a fake order", () => {
  assert.equal(promisedLater("Kal soch ke batata hoon"), true);
  assert.equal(promisedLater("100 pieces chahiye"), false);
  assert.equal(recoveryTypeFromState("PRICE_PROVIDED", { promisedLater: true }), "PROMISED_LATER");
  assert.equal(recoveryTypeFromState("PRICE_PROVIDED"), "PRICE_ASKED_THEN_GONE");
  assert.equal(recoveryTypeFromState("NEW_ENQUIRY", { stockShort: true }), "UNAVAILABLE_INVENTORY");
});

test("delivery is refused until a payment is provider-paid", () => {
  assert.equal(canBookDelivery([{ status: "pending" }]), false);
  assert.equal(canBookDelivery([{ status: "paid" }]), true);
});

test("mock payment link is created pending, not marked paid", async () => {
  const link = await mockPayments.createPaymentLink({
    amountPaise: 850000,
    reference: "test",
    description: "test",
  });
  assert.equal(link.ok, true);
  assert.match(link.url, /pay\.mock/);
  assert.doesNotMatch(link.id, /paid/i);
});

test("Starter cannot hire Priya; Growth can", () => {
  const priya = WORKFORCE_TEMPLATES.find((t) => t.key === "PRIYA")!;
  assert.equal(planAllowsHire("STARTER", priya), false);
  assert.equal(planAllowsHire("BUSINESS", priya), false);
  assert.equal(planAllowsHire("GROWTH", priya), true);
});

test("owner memory rebuilds from remaining facts after delete", () => {
  const memory = rebuildMemory([
    { field: "note", value: "Prefers morning delivery", source: "OWNER_INPUT" },
    { field: "location", value: "Tilak Nagar", source: "CUSTOMER_MESSAGE" },
  ]);
  assert.deepEqual(memory.importantNotes, ["Prefers morning delivery"]);
  assert.equal(memory.location, "Tilak Nagar");
  const afterDelete = rebuildMemory([{ field: "location", value: "Tilak Nagar", source: "CUSTOMER_MESSAGE" }]);
  assert.deepEqual(afterDelete.importantNotes, []);
  const copied = applyFact(emptyMemory(), { field: "note", value: "a", source: "OWNER_INPUT" });
  assert.deepEqual(emptyMemory().importantNotes, []);
  assert.deepEqual(copied.importantNotes, ["a"]);
});

test("default rules cover payment, delivery, returns, hours, and phrases", () => {
  const types = DEFAULT_ELECTRICAL_RULES.map((r) => r.ruleType);
  for (const needed of ["PAYMENT", "DELIVERY", "RETURN", "HOURS", "PHRASE", "DISCOUNT", "CREDIT"]) {
    assert.ok(types.includes(needed as (typeof DEFAULT_ELECTRICAL_RULES)[number]["ruleType"]));
  }
});
