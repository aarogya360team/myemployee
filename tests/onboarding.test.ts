import assert from "node:assert/strict";
import { test } from "node:test";
import { canGoLive, goLiveChecklist, ONBOARDING_STEPS } from "../src/lib/onboarding";
import { appearanceById, parsePersonality, pauseUntilFrom } from "../src/lib/employee-identity";
import { PRODUCT_POSITIONING } from "../src/lib/usp/positioning";
import { BRAND } from "../src/lib/brand";

test("product name is Aurel", () => {
  assert.equal(BRAND.name, "Aurel");
  assert.equal(PRODUCT_POSITIONING.name, "Aurel");
});

test("onboarding has nine merchant steps", () => {
  assert.equal(ONBOARDING_STEPS.length, 9);
});

test("go live requires hire, catalogue decision, rules, and a test — not WhatsApp", () => {
  const blocked = goLiveChecklist({
    hasBusiness: true,
    hasEmployee: true,
    productCount: 0,
    catalogueSkipped: false,
    testCompleted: false,
    rulesReviewed: false,
    whatsappConnected: false,
  });
  assert.equal(canGoLive(blocked), false);

  const ready = goLiveChecklist({
    hasBusiness: true,
    hasEmployee: true,
    productCount: 0,
    catalogueSkipped: true,
    testCompleted: true,
    rulesReviewed: true,
    whatsappConnected: false,
  });
  assert.equal(canGoLive(ready), true);
  assert.equal(ready.find((item) => item.id === "whatsapp")?.required, false);
});

test("appearance catalog maps ids to portraits", () => {
  assert.equal(appearanceById("rahul-formal").src, "/avatars/rahul-formal.png");
  assert.equal(appearanceById("unknown").id, "rahul-formal");
});

test("personality parser fills defaults without inventing tone", () => {
  const parsed = parsePersonality({}, "professional");
  assert.equal(parsed.tone, "professional");
  assert.equal(parsed.addressForm, "aap");
  assert.equal(parsed.greeting, "namaste");
});

test("pause 15m sets a future timestamp", () => {
  const before = Date.now();
  const pause = pauseUntilFrom("15m");
  assert.equal(pause.status, "PAUSED");
  assert.ok(pause.pauseUntil && pause.pauseUntil.getTime() > before);
  assert.equal(pauseUntilFrom("resume").status, "WORKING");
});
