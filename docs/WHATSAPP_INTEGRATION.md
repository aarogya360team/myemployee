# WhatsApp integration

## Merchant experience

Rahul uses the number customers already know, or a dedicated number later.

Button: **Connect WhatsApp**. After success: “WhatsApp connected” + the display number (masked). Failures: “Rahul cannot currently access WhatsApp.” Retry.

Three onboarding choices:

- **Use my existing WhatsApp** — keep the current business number (Meta Coexistence / Embedded Signup when the platform is a Tech Provider).
- **Get a new number for my AI employee** — `PhoneNumberProvider` abstraction. Purchase is **NOT_CONNECTED** until a telephony provider is wired.
- **I’m not sure** — recommend existing number if they already use WhatsApp Business.

## Engineering (never shown in UI)

Interface: `src/lib/providers/whatsapp-provider.ts`

| Method | Purpose |
|---|---|
| `getConnectionStatus` | `REAL` / `NOT_CONNECTED` / `DEMO` |
| `connectFromEmbeddedSignup` | Exchange Meta code server-side, store secrets encrypted |
| `sendMessage` / `sendDocument` | Cloud API |
| `handleWebhook` | `/api/webhooks/whatsapp` |

Implementation today: `MetaCloudWhatsAppProvider`. Replaceable.

Secrets stay in `Integration.config` (encrypted) on the server. GET `/api/integrations/whatsapp` returns only merchant-safe fields.

Webhook URL is platform infrastructure (`APP_URL` + `/api/webhooks/whatsapp`), not a merchant setting.

## Honest status

| State | Meaning |
|---|---|
| `NOT_CONNECTED` | No live send/receive. Test mode is DEMO only. |
| `DEMO` | Owner typed in the inbox simulator. No customer WhatsApp. |
| `REAL` | Cloud API token stored, webhook verified, send confirmed by Meta. |
| `MOCK` | Only when `DEMO_MODE=true` for internal rehearsal. Never labelled “connected”. |
