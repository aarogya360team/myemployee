import { HttpError } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/platform/tenant";
import { PLAN_CATALOG, type FeatureCode } from "./catalog";

export async function getActiveSubscription(businessId: string) {
  return prisma.subscription.findFirst({
    where: {
      businessId,
      status: { in: ["TRIALING", "ACTIVE", "GRACE"] },
    },
    include: { plan: { include: { features: true, limits: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasFeature(businessId: string, feature: FeatureCode) {
  const sub = await getActiveSubscription(businessId);
  if (!sub) return false;
  if (["EXPIRED", "CANCELED", "PAST_DUE"].includes(sub.status) && sub.status !== "GRACE") {
    return false;
  }
  return sub.plan.features.some((row) => row.feature === feature);
}

export async function requireFeature(ctx: TenantContext, feature: FeatureCode) {
  const ok = await hasFeature(ctx.businessId, feature);
  if (!ok) {
    throw new HttpError(402, "Rahul can do this. Upgrade Rahul's plan.");
  }
}

export async function getLimit(businessId: string, key: string) {
  const sub = await getActiveSubscription(businessId);
  if (!sub) return 0;
  const row = sub.plan.limits.find((item) => item.key === key);
  let extra = 0;
  const addons = await prisma.addonSubscription.findMany({
    where: { businessId, status: "ACTIVE" },
    include: { addon: true },
  });
  for (const item of addons) {
    if (item.addon.metric === key && item.addon.amount) extra += item.addon.amount;
  }
  return (row?.value ?? 0) + extra;
}

export async function checkUsageLimit(businessId: string, metric: string) {
  const limit = await getLimit(businessId, metric);
  const periodKey = new Date().toISOString().slice(0, 7);
  const counter = await prisma.usageCounter.findUnique({
    where: {
      businessId_metric_periodKey: { businessId, metric, periodKey },
    },
  });
  const used = counter?.used ?? 0;
  const ratio = limit === 0 ? 1 : used / limit;
  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    blocked: used >= limit,
    warn:
      ratio >= 1 ? 100 : ratio >= 0.9 ? 90 : ratio >= 0.75 ? 75 : ratio >= 0.5 ? 50 : 0,
  };
}

export async function incrementUsage(businessId: string, metric: string, quantity = 1) {
  const periodKey = new Date().toISOString().slice(0, 7);
  const usage = await checkUsageLimit(businessId, metric);
  if (usage.blocked) {
    throw new HttpError(402, "This month's limit is over. Upgrade or add capacity.");
  }
  await prisma.usageCounter.upsert({
    where: { businessId_metric_periodKey: { businessId, metric, periodKey } },
    update: { used: { increment: quantity } },
    create: { businessId, metric, periodKey, used: quantity },
  });
  await prisma.usageRecord.create({
    data: { businessId, metric, quantity },
  });
}

export async function startTrial(businessId: string, planCode = "STARTER") {
  const existing = await prisma.subscription.findFirst({
    where: { businessId, status: { in: ["TRIALING", "ACTIVE", "GRACE"] } },
  });
  if (existing) return existing;
  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan) {
    throw new HttpError(
      500,
      "Billing plans are missing. Re-run prisma/migrations/20260824180000_commerce_and_usp/migration.sql, then try Hire again.",
    );
  }
  const spec = PLAN_CATALOG.find((item) => item.code === planCode);
  const now = new Date();
  const trialDays = spec?.trialDays ?? 14;
  const trialEnds = new Date(now.getTime() + trialDays * 86400000);
  return prisma.subscription.create({
    data: {
      businessId,
      planId: plan.id,
      status: "TRIALING",
      periodStart: now,
      periodEnd: trialEnds,
      trialEndsAt: trialEnds,
    },
  });
}
