import { getAiEmployee } from "./ai-employee";
import { DEFAULT_BUSINESS_HOURS } from "./constants";
import { trackFunnel } from "./funnel";
import { merchantWhatsAppStatus } from "./integrations";
import { getPlatformEnv } from "./platform/env";
import type { TenantContext } from "./platform/tenant";
import { prisma } from "./prisma";
import { parseJson, HttpError } from "./tenant";

export const WHATSAPP_PATHS = ["EXISTING", "NEW", "UNSURE"] as const;
export type WhatsAppPath = (typeof WHATSAPP_PATHS)[number];

export const ONBOARDING_STEPS = [
  { id: 1, key: "business", title: "Your business" },
  { id: 2, key: "employee", title: "Hire your employee" },
  { id: 3, key: "whatsapp", title: "WhatsApp" },
  { id: 4, key: "catalogue", title: "Catalogue" },
  { id: 5, key: "rules", title: "Rules" },
  { id: 6, key: "escalation", title: "When to call you" },
  { id: 7, key: "language", title: "Hours and language" },
  { id: 8, key: "test", title: "Test" },
  { id: 9, key: "live", title: "Go live" },
] as const;

export type OnboardingJson = {
  whatsappPath?: WhatsAppPath;
  catalogueSkipped?: boolean;
  testCompleted?: boolean;
  rulesReviewed?: boolean;
  escalationReviewed?: boolean;
  languageReviewed?: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
  hint?: string;
};

export function parseOnboardingJson(raw: string | null | undefined): OnboardingJson {
  return parseJson<OnboardingJson>(raw ?? "{}", {});
}

export function defaultHours() {
  return DEFAULT_BUSINESS_HOURS.map((row) => ({ ...row }));
}

export function goLiveChecklist(input: {
  hasBusiness: boolean;
  hasEmployee: boolean;
  productCount: number;
  catalogueSkipped: boolean;
  testCompleted: boolean;
  rulesReviewed: boolean;
  whatsappConnected: boolean;
}): ChecklistItem[] {
  return [
    { id: "business", label: "Business created", done: input.hasBusiness, required: true },
    { id: "employee", label: "Employee hired", done: input.hasEmployee, required: true },
    {
      id: "catalogue",
      label: "Catalogue ready",
      done: input.productCount > 0 || input.catalogueSkipped,
      required: true,
      hint: input.catalogueSkipped ? "Skipped — add products before quoting live customers." : undefined,
    },
    { id: "rules", label: "Rules reviewed", done: input.rulesReviewed, required: true },
    { id: "test", label: "Test conversation done", done: input.testCompleted, required: true },
    {
      id: "whatsapp",
      label: "WhatsApp connected",
      done: input.whatsappConnected,
      required: false,
      hint: input.whatsappConnected
        ? undefined
        : "You can go live for testing. Customers reach your employee on WhatsApp after you connect it.",
    },
  ];
}

export function canGoLive(items: ChecklistItem[]) {
  return items.filter((item) => item.required).every((item) => item.done);
}

export async function getOnboardingSnapshot(ctx: TenantContext) {
  const env = getPlatformEnv();
  const [business, employee, productCount, whatsapp] = await Promise.all([
    prisma.business.findFirstOrThrow({
      where: { id: ctx.businessId },
      include: { hours: { orderBy: { dayOfWeek: "asc" } }, settings: true },
    }),
    getAiEmployee(ctx),
    prisma.product.count({ where: { businessId: ctx.businessId } }),
    merchantWhatsAppStatus(ctx.businessId, Boolean(env.metaAppId && env.metaConfigId)),
  ]);
  const json = parseOnboardingJson(business.onboardingJson);
  const checklist = goLiveChecklist({
    hasBusiness: true,
    hasEmployee: Boolean(employee),
    productCount,
    catalogueSkipped: Boolean(json.catalogueSkipped),
    testCompleted: Boolean(json.testCompleted),
    rulesReviewed: Boolean(json.rulesReviewed),
    whatsappConnected: whatsapp.connected,
  });
  return {
    created: true,
    step: Math.min(Math.max(business.onboardingStep || 3, 1), 9),
    goLiveAt: business.goLiveAt,
    json,
    business: {
      id: business.id,
      name: business.name,
      category: business.category,
      city: business.city,
      phone: business.phone,
      address: business.address,
      defaultLanguage: business.defaultLanguage,
      whatsappPath: business.whatsappPath,
    },
    hours: business.hours.length === 7 ? business.hours : defaultHours(),
    employee: employee
      ? {
          id: employee.id,
          name: employee.name,
          avatar: employee.avatar,
          status: employee.status,
        }
      : null,
    productCount,
    whatsapp,
    checklist,
    canGoLive: canGoLive(checklist),
    live: Boolean(business.goLiveAt),
  };
}

export async function saveOnboardingProgress(
  ctx: TenantContext,
  input: { step?: number; json?: Partial<OnboardingJson>; whatsappPath?: WhatsAppPath | null },
) {
  const business = await prisma.business.findFirstOrThrow({ where: { id: ctx.businessId } });
  const json = { ...parseOnboardingJson(business.onboardingJson), ...input.json };
  const nextStep = input.step ?? business.onboardingStep;
  const updated = await prisma.business.update({
    where: { id: ctx.businessId },
    data: {
      onboardingStep: nextStep,
      onboardingJson: JSON.stringify(json),
      ...(input.whatsappPath !== undefined ? { whatsappPath: input.whatsappPath } : {}),
    },
  });
  if (input.json?.testCompleted) {
    await trackFunnel({ name: "test_completed", businessId: ctx.businessId, userId: ctx.userId });
  }
  return { ...updated, json };
}

export async function markGoLive(ctx: TenantContext, userId: string) {
  const snapshot = await getOnboardingSnapshot(ctx);
  if (snapshot.live) return snapshot;
  if (!snapshot.canGoLive) {
    throw new HttpError(400, "Finish the required setup steps first.");
  }
  await prisma.$transaction([
    prisma.business.update({
      where: { id: ctx.businessId },
      data: {
        goLiveAt: new Date(),
        onboardingStep: 9,
      },
    }),
    prisma.employee.updateMany({
      where: { businessId: ctx.businessId, type: "AI" },
      data: { status: "WORKING", pauseUntil: null },
    }),
  ]);
  await trackFunnel({ name: "go_live", businessId: ctx.businessId, userId });
  return getOnboardingSnapshot(ctx);
}
