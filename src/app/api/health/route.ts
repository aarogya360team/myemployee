import { json } from "@/lib/http";
import { isLocalPostgres } from "@/lib/platform/env";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({
      ok: true,
      database: isLocalPostgres() ? "local-postgres" : "hosted",
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
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
        warning: isLocalPostgres()
          ? "Postgres is not running. Create a free Supabase project (Mumbai), paste DATABASE_URL + DIRECT_URL into .env, then run npx prisma migrate deploy && npx tsx prisma/seed.ts."
          : "The hosted database is unreachable. Check the Supabase connection strings.",
      },
      503,
    );
  }
}
