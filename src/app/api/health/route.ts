import { json } from "@/lib/http";
import { llmConfigured } from "@/lib/llm/openai";
import { isLocalPostgres } from "@/lib/platform/env";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const meta = Boolean(
    (process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID) &&
      process.env.META_APP_SECRET &&
      process.env.META_CONFIG_ID,
  );
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({
      ok: true,
      database: isLocalPostgres() ? "local-postgres" : "hosted",
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      llm: llmConfigured(),
      meta,
      warning: isLocalPostgres()
        ? "DATABASE_URL still points at localhost. Put the Supabase pooled URI in .env and restart."
        : null,
    });
  } catch {
    return json(
      {
        ok: false,
        database: "unreachable",
        supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        llm: llmConfigured(),
        meta,
        warning: isLocalPostgres()
          ? "Postgres is not running. Create a free Supabase project, paste DATABASE_URL + DIRECT_URL into .env, then run npx prisma migrate deploy."
          : "The hosted database is unreachable. Check the Supabase connection strings.",
      },
      503,
    );
  }
}
