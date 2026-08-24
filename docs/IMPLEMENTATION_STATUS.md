# Implementation status

Last updated: 2026-08-25

Brand in the product UI: **Aurel**. Repo/package name remains `myemployee`.

## How to read this

| Label | Meaning |
|---|---|
| **REAL** | Works in the product when the required account is connected. |
| **DEMO** | Owner testing inside Aurel. Never a live customer send. |
| **MOCK** | Only if `DEMO_MODE=true` for internal rehearsal. Never labelled “connected”. |
| **NOT_CONNECTED** | Feature exists; live provider is waiting on your keys/account. |

## Merchant path (complete in-app)

1. Sign up (email or Google when `GOOGLE_CLIENT_*` is set) → **REAL** in-app; Google **NOT_CONNECTED** until you add OAuth keys.
2. 9-step hire: business → employee (avatar, language, appearance) → WhatsApp path → catalogue → rules → escalation → hours → **DEMO** test → go live. Resumable via `Continue setup`.
3. Inbox is a business workspace (state, next action, order/payment/delivery, take over). Tryout is **DEMO**.
4. Catalogue: manual add + CSV import. Rahul quotes only from this list.
5. Money home reports attributed orders only. Paid/delivered only after provider confirm.

## Channels and money movement

| Capability | Status |
|---|---|
| WhatsApp Embedded Signup + Cloud API send/receive | **NOT_CONNECTED** until Meta Tech Provider keys (`NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`). Merchant UI never shows WABA, tokens, or webhooks. |
| New dedicated WhatsApp number purchase | **NOT_CONNECTED** (`PhoneNumberProvider` stub). |
| Razorpay collect / webhook paid | Wired; **NOT_CONNECTED** until shop payment is enabled by the platform. No merchant token-paste form. |
| Shiprocket book / delivered | Wired; **NOT_CONNECTED** until courier is enabled. Delivery refused if unpaid. |
| Inbox / tryout | **DEMO** until WhatsApp is **REAL**. |

## Platform

One Aurel deployment, many shops. Queries use `TenantContext`. Use hosted Supabase Postgres (`DATABASE_URL` pooled + `DIRECT_URL`). Auth sessions are first-party cookies.

Google login: code is **REAL**; live Google accounts need your Client ID/secret and redirect `{APP_URL}/api/auth/google/callback`.

## Out of first MVP (honest)

Priya/Amit/Neha as extra paid seats, PDF catalogue ingest, native mobile app, admin console, voice calling, ads, guaranteed ROI.
