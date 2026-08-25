import assert from "node:assert/strict";
import { test } from "node:test";
import { overlapScore, rankExamples, skillSummary } from "../src/lib/learning/rank";

test("human replies outrank weak AI examples for a similar enquiry", () => {
  const ranked = rankExamples("12 watt philips ka rate?", [
    {
      source: "AI_SUCCESS",
      intent: "price",
      customerText: "hello",
      reply: "Namaste, kya chahiye?",
      weight: 1,
    },
    {
      source: "HUMAN",
      intent: "price",
      customerText: "bhai philips 12w bulb rate",
      reply: "Philips 12W catalogue se confirm karke pieces poochho",
      weight: 5,
    },
  ]);
  assert.ok(ranked[0].source === "HUMAN");
  assert.ok(overlapScore("philips 12w", "philips 12 watt bulb") > 0.2);
});

test("owner takeovers unlock skills incrementally", () => {
  const summary = skillSummary([
    { source: "HUMAN", intent: "price" },
    { source: "HUMAN", intent: "address" },
    { source: "HUMAN", intent: "price" },
    { source: "AI_SUCCESS", intent: "greeting" },
  ]);
  assert.equal(summary.humanReplies, 3);
  assert.equal(summary.readyForMore, true);
  assert.ok(summary.skillsUnlocked.includes("address"));
});
