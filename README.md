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

1. Create a **Supabase** (or Neon) Postgres database. Use the **exact** pooler host from **Connect → ORMs → Prisma** — do not assume Mumbai/`ap-south-1`.
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

Optional platform keys (Production + Preview):

| Name | Value |
|---|---|
| `LLM_API_KEY` or `OPENAI_API_KEY` | OpenAI secret key (`sk-...`) from https://platform.openai.com/api-keys |
| `LLM_MODEL` | `gpt-4o-mini` (default) |
| `NEXT_PUBLIC_META_APP_ID` | Meta app ID |
| `META_APP_SECRET` | Meta app secret |
| `META_CONFIG_ID` | WhatsApp Embedded Signup configuration ID |
| `META_WEBHOOK_VERIFY_TOKEN` | Same string you enter in Meta webhook verify (default `aurel-whatsapp-verify`) |

Shop Razorpay / Shiprocket keys are entered in the app at **Payments**, not in Vercel.

4. Deploy. Build runs `prisma generate && next build` (it does **not** connect to Postgres). After the first successful deploy, create tables in Supabase: **SQL Editor** → run the files in `prisma/migrations/` in timestamp order (oldest first). Copy `DATABASE_URL` / `DIRECT_URL` from **Connect → ORMs → Prisma** in the dashboard (do not guess the region).

## OpenAI key

1. Open [platform.openai.com/api-keys](https://platform.openai.com/api-keys) while logged into the OpenAI account that already has billing.
2. **Create new secret key**. Copy it once (`sk-...`).
3. Vercel → aurel-employee → Settings → Environment Variables → `LLM_API_KEY` = that value (Production and Preview).
4. Redeploy. `/api/health` should show `"llm": true`. Without the key, Rahul still replies from the catalogue engine.

## Meta WhatsApp (live customers)

You cannot finish this from an API key alone. You need a Meta developer app that is allowed to use WhatsApp Embedded Signup (Tech Provider / Business).

1. [developers.facebook.com](https://developers.facebook.com) → Create app → Business type → add **WhatsApp**.
2. WhatsApp → **API Setup** / **Configuration**: copy **App ID** → `NEXT_PUBLIC_META_APP_ID`, **App Secret** → `META_APP_SECRET`.
3. Create an **Embedded Signup** configuration; copy the config ID → `META_CONFIG_ID`.
4. WhatsApp → **Configuration** → webhook:
   - Callback URL: `https://aurel-employee.vercel.app/api/webhooks/whatsapp`
   - Verify token: same as `META_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to `messages`.
5. Redeploy. In Aurel open **WhatsApp** → Connect WhatsApp (uses the number customers already know).
6. `/api/health` shows `"meta": true` when App ID, secret, and config ID are all set.

Each shop still has its own `business_id`. The platform is shared; data is not.
