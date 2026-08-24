import { ADDON_CATALOG, PLAN_CATALOG } from "../src/lib/billing/catalog";
import { prisma } from "../src/lib/prisma";

async function main() {
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
    await prisma.planFeature.deleteMany({ where: { planId: row.id } });
    await prisma.planFeature.createMany({
      data: plan.features.map((feature) => ({ planId: row.id, feature })),
    });
    await prisma.planLimit.deleteMany({ where: { planId: row.id } });
    await prisma.planLimit.createMany({
      data: Object.entries(plan.limits).map(([key, value]) => ({
        planId: row.id,
        key,
        value,
      })),
    });
  }

  for (const addon of ADDON_CATALOG) {
    await prisma.addon.upsert({
      where: { code: addon.code },
      update: {
        name: addon.name,
        description: addon.description,
        monthlyPaise: addon.monthlyPaise,
        requiresFeature: addon.requiresFeature,
        metric: addon.metric,
        amount: addon.amount,
      },
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

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
