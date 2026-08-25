/**
 * Platform env vs tenant secrets.
 *
 * Platform keys (this file / process env) are shared infrastructure.
 * Shop WhatsApp tokens, Razorpay keys, etc. live in Integration rows
 * scoped by businessId — never in a global env var that all tenants share.
 */
export function getPlatformEnv() {
  const production = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  return {
    databaseUrl: required("DATABASE_URL"),
    sessionSecret: production
      ? required("SESSION_SECRET")
      : (process.env.SESSION_SECRET ?? "dev-session-secret"),
    platformName: process.env.PLATFORM_NAME ?? "Aurel",
    demoMode: process.env.DEMO_MODE === "true",
    llmApiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || null,
    llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
    appUrl: (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
    metaAppId: process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || null,
    metaAppSecret: process.env.META_APP_SECRET || null,
    metaConfigId: process.env.META_CONFIG_ID || null,
    metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || "aurel-whatsapp-verify",
    metaApiVersion: process.env.META_API_VERSION || "v21.0",
  };
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env`);
  }
  return value;
}

export function isLocalPostgres(url = process.env.DATABASE_URL ?? "") {
  return /localhost|127\.0\.0\.1/i.test(url);
}
