# Aurel

AI employee for Indian product businesses (wholesale, electrical, apparel, auto-parts — not kirana). One Vercel deployment, many shops, tenant isolation.

Product promise: **Don't just answer customers. Complete the sale.**

## Local

Postgres is required. Prefer **hosted Supabase** (pooled `DATABASE_URL` + direct `DIRECT_URL`). SQLite will not work on Vercel.

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

Open `http://localhost:3000`. Sign up, hire Rahul, test in DEMO, then go live. Live WhatsApp/Google/payments need your provider keys.

## Vercel

1. Create a **Supabase** (or Neon) Postgres database in Mumbai/`ap-south-1` if you can.
2. Import the GitHub repo on Vercel (framework: Next.js). Region: `bom1` (see `vercel.json`).
3. Set environment variables for Production and Preview:

| Name | Value |
|---|---|
| `DATABASE_URL` | **Pooled** connection string (`sslmode=require`). On Neon, enable PgBouncer. |
| `DIRECT_URL` | **Direct / unpooled** string (used by `prisma migrate deploy` at build). |
| `SESSION_SECRET` | Long random string |
| `PLATFORM_NAME` | Aurel |
| `DEMO_MODE` | false |
| `APP_URL` | Public URL of this deployment |

Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, Meta Embedded Signup (`NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`), `LLM_API_KEY`. Shop WhatsApp/Razorpay secrets stay per-business, not here.

4. Deploy. Build runs `prisma generate && prisma migrate deploy && next build`.

Each shop still has its own `business_id`. The platform is shared; data is not.
