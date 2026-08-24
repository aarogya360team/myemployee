# Aurel — architecture

**Product:** Aurel is an AI employee platform for Indian MSMEs. First live path: Delhi / Mumbai product businesses (electrical wholesale, hardware, garments, auto parts). WhatsApp is the customer channel. The job is completed business, not conversations.

**Primary USP:** Don't just answer customers. Complete the sale.

**Repo:** `aarogya360team/myemployee` (package name unchanged). Brand in product UI: **Aurel**.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 App Router, React 19, TypeScript |
| DB | Prisma + PostgreSQL. Target: hosted **Supabase** (`DATABASE_URL` pooled + `DIRECT_URL`) |
| Auth | Email/password, httpOnly session cookie, `Session` row |
| Tenancy | Every query goes through `TenantContext.businessId` |
| AI employee | `Employee` row (Rahul). Conversation engine in `src/lib/usp/` + `src/lib/language/` |
| Channels | `WhatsAppProvider` interface. Meta Cloud API is one implementation |
| Payments | `PaymentProvider` — Razorpay when connected, mock only if `DEMO_MODE=true` |
| Delivery | `DeliveryProvider` — Shiprocket when connected, mock only if `DEMO_MODE=true` |

## Domains (code map)

Merchant URLs stay short and non-technical. Internal modules match the spec entities.

| Spec domain | Route / module |
|---|---|
| Business | `/onboard`, `/api/business`, `Business` |
| Employees | `/ai-employee`, `/app/team` |
| Customers | `/app/customers` |
| Conversations | `/app/inbox` |
| Products / inventory / pricing | `/app/products` (`Product.pricePaise`, `stock`) |
| Quotes / orders | Conversation `draftJson` + `Order` |
| Payments / delivery | `ShopPayment`, `Delivery`, provider interfaces |
| Follow-ups / recovery | `/app/opportunities` |
| Escalations | `/app/escalations` |
| Integrations | `/onboard` WhatsApp step, `/app/go-live` |
| Analytics | `/app` money home — AI-assisted revenue, not message counts |
| Admin | not built (Phase 2+) |

## Rules

- Business logic depends on provider **interfaces**, not Meta/Razorpay/Shiprocket types.
- Merchant UI never shows WABA, tokens, phone-number IDs, webhooks, or app IDs.
- Paid / delivered only after a provider webhook confirms.
- Prices and stock only from catalogue / owner input.
- Status of every integration is one of: `REAL` · `MOCK` · `DEMO` · `NOT_CONNECTED`.
