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
| `DATABASE_URL` | Supabase **Transaction pooler** (`*.pooler.supabase.com:6543`, `pgbouncer=true`). Never `localhost`. |
| `DIRECT_URL` | Supabase **Session pooler** (`*.pooler.supabase.com:5432`). **Do not** use `db.xxxx.supabase.co` on Vercel — that host is IPv6-only and migrate fails with P1001. |
| `SESSION_SECRET` | Long random string |
| `PLATFORM_NAME` | Aurel |
| `DEMO_MODE` | false |
| `APP_URL` | Public URL of this deployment |

Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, Meta Embedded Signup (`NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`), `LLM_API_KEY`. Shop WhatsApp/Razorpay secrets stay per-business, not here.

4. Deploy. Build runs `prisma generate && next build` (it does **not** connect to Postgres). After the first successful deploy, create tables in Supabase: **SQL Editor** → run the files in `prisma/migrations/` in timestamp order (oldest first). Copy `DATABASE_URL` / `DIRECT_URL` from **Connect → ORMs → Prisma** in the dashboard (do not guess the region).

Each shop still has its own `business_id`. The platform is shared; data is not.
