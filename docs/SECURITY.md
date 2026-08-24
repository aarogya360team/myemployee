# Security

- Tenant isolation: `TenantContext`; queries always include `businessId`.
- Session cookie httpOnly, sameSite lax.
- Provider secrets never returned to the browser. Encrypted at rest when `SESSION_SECRET` is set.
- Webhooks verify signatures when the provider secret exists (Meta `X-Hub-Signature-256`, Razorpay HMAC).
- Idempotency: paid/delivered transitions are no-ops if already in that status; duplicate WhatsApp message ids should not create duplicate orders (order keyed by conversation + current draft).
- Audit: `AuditLog` for signup, business create, integration connect, takeover.
- AI cannot mark payment received or delivery completed except via provider webhooks.
- Do not log access tokens.

Support staff must not see customer WhatsApp tokens. Admin (unbuilt) should show connection health only.
