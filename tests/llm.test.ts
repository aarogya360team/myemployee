import assert from "node:assert/strict";
import { test } from "node:test";
import { inventedMoney } from "../src/lib/llm/rewrite-reply";

test("rejects a rewritten reply that invents a rupee amount", () => {
  assert.equal(inventedMoney("Catalogue se confirm karke bataunga.", []), false);
  assert.equal(inventedMoney("Rate ₹450 hai.", []), true);
  assert.equal(inventedMoney("Quote: 10 × Philips 12W = ₹1,200 (catalogue).", ["₹1,200"]), false);
  assert.equal(inventedMoney("Special rate ₹99 only.", ["₹1,200"]), true);
});
