import { ADDON_CATALOG, PLAN_CATALOG } from "./catalog";
import { prisma } from "@/lib/prisma";

export async function ensureBillingCatalog() {
  const count = await prisma.plan.count().catch((error: unknown) => {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "P2021" || code === "P2022") {
      throw new Error(
        "Missing Plan tables. Run prisma/migrations/20260824180000_commerce_and_usp/migration.sql in the SQL editor.",
      );
    }
    throw error;
  });
  if (count >= PLAN_CATALOG.length) return;
  for (const plan of PLAN_CATALOG) {
    const row = await prisma.plan.upsert({
      where: { code: plan.code },
      update: {},
      create: {
        code: plan.code,
        name: plan.name,
        tagline: plan.tagline,
        monthlyPaise: plan.monthlyPaise,
        annualPaise: plan.annualPaise,
        trialDays: plan.trialDays,
        popular: plan.popular,
        sortOrder: plan.sortOrder,
        features: { create: plan.features.map((feature) => ({ feature })) },
        limits: {
          create: Object.entries(plan.limits).map(([key, value]) => ({ key, value })),
        },
      },
    });
    if (row) {
      /* created or existed */
    }
  }
  for (const addon of ADDON_CATALOG) {
    await prisma.addon.upsert({
      where: { code: addon.code },
      update: {},
      create: {
        code: addon.code,
        name: addon.name,
        description: addon.description,
        monthlyPaise: addon.monthlyPaise,
        requiresFeature: addon.requiresFeature,
        metric: addon.metric,
        amount: addon.amount,
      },
    });
  }
}
