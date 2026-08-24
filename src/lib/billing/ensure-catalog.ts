import { Prisma } from "@prisma/client";
import { ADDON_CATALOG, PLAN_CATALOG } from "./catalog";
import { prisma } from "@/lib/prisma";

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

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
  if (count < PLAN_CATALOG.length) {
    for (const plan of PLAN_CATALOG) {
      const row = await prisma.plan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          tagline: plan.tagline,
          monthlyPaise: plan.monthlyPaise,
          annualPaise: plan.annualPaise,
          trialDays: plan.trialDays,
          popular: plan.popular,
          sortOrder: plan.sortOrder,
        },
        create: {
          code: plan.code,
          name: plan.name,
          tagline: plan.tagline,
          monthlyPaise: plan.monthlyPaise,
          annualPaise: plan.annualPaise,
          trialDays: plan.trialDays,
          popular: plan.popular,
          sortOrder: plan.sortOrder,
        },
      });
      for (const feature of plan.features) {
        await prisma.planFeature.upsert({
          where: { planId_feature: { planId: row.id, feature } },
          update: {},
          create: { planId: row.id, feature },
        }).catch((error) => {
          if (!isUnique(error)) throw error;
        });
      }
      for (const [key, value] of Object.entries(plan.limits)) {
        await prisma.planLimit.upsert({
          where: { planId_key: { planId: row.id, key } },
          update: { value },
          create: { planId: row.id, key, value },
        }).catch((error) => {
          if (!isUnique(error)) throw error;
        });
      }
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
    }).catch((error) => {
      if (!isUnique(error)) throw error;
    });
  }
}
