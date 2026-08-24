# USP audit

Last updated: 2026-08-24

Central idea: **Don't just answer customers. Complete the sale.**

Proof: **We measure the money your AI employee helps you make.**

First live path we will defend: for a Delhi electrical wholesaler, Rahul takes a WhatsApp enquiry as far toward a paid, delivered order as the business allows. Workforce (Priya/Amit/Neha) can be hired in-app when the plan has seats; they are not a second live path.

Statuses: **IMPLEMENTED** · **PARTIAL** · **MOCK** · **MISSING**

---

## CORE USP

| Claim | Status | Notes |
|---|---|---|
| Positioning is centralized (`USP_PRIMARY`, `USP_SECONDARY`, `USP_DESCRIPTION`, `USP_WORKFLOW`, `USP_METRICS`) | IMPLEMENTED | `src/lib/usp/positioning.ts` — do not scatter copy |
| Not positioned as chatbot / FAQ bot / ChatGPT for business | IMPLEMENTED | Forbidden phrases kept out of landing and owner chrome |
| Enquiry → recommendation → quote → order → payment → delivery → follow-up → repeat | MOCK | State machine + owner Orders desk exist. Payment/delivery/WhatsApp use mock providers. Paid/delivered only after mock webhook |
| Distinguishes answering vs completing a transaction | IMPLEMENTED | Next-best-action engine; stalling pulls back to product/qty |
| Primary KPI is AI-assisted revenue, not messages | IMPLEMENTED | Owner home is the money screen. Scorecard ignores message count |

## COMPETITIVE DIFFERENTIATION

| Claim | Status | Notes |
|---|---|---|
| Internal capability matrix vs generic chatbot / WA AI / CRM / ERP | IMPLEMENTED | Competitor columns are `unknown` — no fabricated gaps |
| Public competitor comparison table | MISSING | Intentionally not on the landing page until verified |
| Conversation → transaction → fulfillment → revenue | MOCK | Architecture + mock fulfillment UI. Live WhatsApp + Razorpay + courier not connected |

## PRODUCT MOAT

| Claim | Status | Notes |
|---|---|---|
| Vertical profile (electrical first) | IMPLEMENTED | Configurable `VerticalProfile`. Clarification replies use vertical terminology/units |
| AI employee templates (Rahul, Priya, Amit, Neha) | IMPLEMENTED | `/app/team` hire flow. STARTER/BUSINESS = 1 seat. Extra hire returns 402 with upgrade copy |
| Employee mental model in UI | IMPLEMENTED | Hire / review / take over / rules — still labeled AI employee |
| Business brain rules evaluated server-side | IMPLEMENTED | Discount, credit, payment-before-delivery, delivery-after-payment, returns, hours, phrases. AI cannot skip `BusinessRule` |

## DATA MOAT

| Claim | Status | Notes |
|---|---|---|
| Customer memory from verified sources only | IMPLEMENTED | Facts stored with source. Owner can add / edit / delete. “Why does Rahul know this?” remains |
| One customer, one journey across channels | PARTIAL | Timeline + phone match on Inbox simulator. Website/Instagram/phone merge is confirmation-gated when the number is uncertain |
| Catalogue intelligence | PARTIAL | Search + owner catalogue UI. No bulk upload yet |

## WORKFLOW MOAT

| Claim | Status | Notes |
|---|---|---|
| Business completion state machine | IMPLEMENTED | `src/lib/usp/completion.ts` |
| Next best action (not exposed to customer) | IMPLEMENTED | Owner debug only |
| Human escalation as a feature | IMPLEMENTED | Handoff summary + priority queue + mute AI on takeover |
| Mock payment / delivery “done” only after provider OK | MOCK | `/app/orders` + `markPaymentPaidByProvider` / `markDeliveredByProvider`. Owner cannot mark paid by guessing |

## REVENUE MOAT

| Claim | Status | Notes |
|---|---|---|
| Attribution with evidence, no double count | IMPLEMENTED | One `totalPaise` per order. Uncertain flagged. Recovered orders flip `aiRole` to `AI_RECOVERED` |
| Recovery opportunities | PARTIAL | All 10 types. Estimate only from price × qty already known. Follow-up uses mock WhatsApp; TRYOUT numbers stay queued |
| Recovered vs assisted revenue split | IMPLEMENTED | Separate cards; recovered stays 0 until an opportunity converts to an order |
| ROI calculator | IMPLEMENTED | Labeled ESTIMATE + disclaimer |
| Proof / case studies | PARTIAL | `/app/proof` publishes only with explicit owner approval and ≥5 orders. No invented before/after. Not on the public landing page |

## CUSTOMER SWITCHING COST

| Claim | Status | Notes |
|---|---|---|
| Accumulating catalogue, memory, rules, journeys | PARTIAL | Schema and writes exist. Value compounds only after real shop usage |
| WhatsApp number as the daily habit | MISSING | Official WhatsApp Cloud API not wired (needs Meta credentials) |

## CURRENT GAPS

- Live WhatsApp inbound/outbound (official API).
- Live Razorpay/UPI capture and webhook → `PAYMENT_RECEIVED`.
- Live delivery booking beyond mocks.
- Bulk catalogue import / Tally-Zoho sync.
- Repeat-order prediction from history (needs real order volume).
- Public case studies on the marketing site.
- Public competitor feature table.

## CRITICAL GAPS

These blocked the USP. Closed in-app where credentials were not required:

| Gap | Status after this pass |
|---|---|
| USP only on a landing page | **Fixed** — constants, engines, owner home, onboarding, rules |
| Chat tryout did not persist a journey | **Fixed** — conversation + NBA + timeline |
| Owner home was an AI-employee profile | **Fixed** — `/app` is the money screen |
| No catalogue for Rahul to quote from | **Fixed** — `/app/products` (DEMO catalogue only if `DEMO_MODE=true`) |
| Fake scores / fake rupees | **Held** — empty states say “Not enough data.” Scorecard uses real latencies (≥5 pairs) and feedback events |
| Memory view-only | **Fixed** — owner edit/delete + staff customer entry |
| Priya/Amit/Neha not hireable | **Fixed** — `/app/team` with plan seat limits |
| Payment/delivery marked done in the UI | **Held as MOCK** — only provider helpers mark paid/delivered |
| WhatsApp production send | **Still missing** — needs Meta app credentials |

## Six buyer tests

### 1. Indian electrical wholesaler
**Why pay?** Rahul can take “100 pieces chahiye” through product, stock, catalogue price, quote, and owner escalation for special rate — then you see rupees on Today, not message counts.
**Fail if:** “because it uses AI” / “because it answers WhatsApp.” Those are not the pitch.

### 2. Garment wholesaler
**Why pay later?** Vertical profile exists (dozen, MOQ, size). **Not the first live bet.** Electrical loop first.

### 3. Hardware distributor
Same as electrical: configurable terminology, not a second product yet.

### 4. Skeptical owner
Dashboard shows zeros and “Not enough data” until real orders exist. ROI calculator is an estimate. Rahul will not invent a rate. Proof will not invent a before picture.

### 5. Meta Business AI user
Difference we actually ship today: journey state + quote/order draft + revenue attribution + human handoff brief + mock payment/delivery desk. We do **not** claim Meta cannot reply on WhatsApp.

### 6. Generic WhatsApp chatbot customer
Difference: next-best-action to complete a business state; recovery queue; money KPIs. Chatbot node-builder language is not used.

If any of those answers were only “AI” or “WhatsApp replies”, this audit would **FAIL**. They are not.

## Honest summary

The USP is **in the architecture and the owner app**. The first live version is still narrow: **electrical catalogue + enquiry progression + owner money screen + mock fulfillment**. Completing a paid, delivered WhatsApp order in a real Delhi shop still needs official WhatsApp and a payment provider. Until ten shops refuse to switch Rahul off, do not spend heavily on the rest of the workforce.
