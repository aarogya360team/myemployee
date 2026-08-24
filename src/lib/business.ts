import { writeAudit } from "./audit";
import { ensureBillingCatalog } from "./billing/ensure-catalog";
import { startTrial } from "./billing/entitlements";
import { DEFAULT_BUSINESS_HOURS } from "./constants";
import { defaultAiEmployeeData, defaultSettingsCreate } from "./ai-employee";
import { pauseUntilFrom, parsePersonality } from "./employee-identity";
import { trackFunnel } from "./funnel";
import { defaultFeatureRows } from "./platform/plugins";
import { loadTenantBusiness, requireOwnerOrAdmin, resolveTenantContext, type TenantContext } from "./platform/tenant";
import { prisma } from "./prisma";
import { setActiveBusinessForUser } from "./session-store";
import { HttpError } from "./tenant";
import { DEFAULT_ELECTRICAL_RULES } from "./usp/rules";
import { verticalFromCategory } from "./usp/verticals";
import { seedElectricalDemoCatalog } from "./usp/demo-catalog";
import type { z } from "zod";
import type { createBusinessSchema, patchBusinessSchema, patchSettingsSchema } from "./validators";

type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
type PatchBusinessInput = z.infer<typeof patchBusinessSchema>;
type PatchSettingsInput = z.infer<typeof patchSettingsSchema>;

export async function createBusinessForOwner(userId: string, input: CreateBusinessInput) {
  const business = await prisma.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: {
        name: input.name,
        legalName: input.legalName || null,
        category: input.category,
        description: input.description || null,
        address: input.address || null,
        city: input.city,
        phone: input.phone && input.phone.replace(/\D/g, "").length >= 8 ? input.phone : "pending",
        email: input.email || null,
        gstin: input.gstin || null,
        timezone: input.timezone,
        defaultLanguage: input.defaultLanguage,
        vertical: verticalFromCategory(input.category),
        onboardingStep: 3,
        onboardingJson: "{}",
        memberships: {
          create: { userId, role: "OWNER" },
        },
        settings: {
          create: defaultSettingsCreate(input.languages, input.aiTone, input.defaultLanguage),
        },
        hours: {
          create: input.hours?.length === 7 ? input.hours : DEFAULT_BUSINESS_HOURS,
        },
        employees: {
          create: defaultAiEmployeeData(input.aiEmployeeName, input.languages, input.aiTone, {
            avatar: input.avatar,
            personality: input.personality,
          }),
        },
        features: {
          create: defaultFeatureRows(),
        },
        referralCode: `AU${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
      include: {
        settings: true,
        hours: { orderBy: { dayOfWeek: "asc" } },
        employees: true,
        memberships: true,
        features: true,
      },
    });
    return created;
  });

  await provisionNewShop(userId, business.id, input.aiEmployeeName, business.name);
  return business;
}

export async function provisionNewShop(
  userId: string,
  businessId: string,
  aiEmployeeName = "Rahul",
  businessName?: string,
) {
  await setActiveBusinessForUser(userId, businessId);
  await ensureBillingCatalog();
  await startTrial(businessId, "STARTER");
  const ruleCount = await prisma.businessRule.count({ where: { businessId } });
  if (ruleCount === 0) {
    await prisma.businessRule.createMany({
      data: DEFAULT_ELECTRICAL_RULES.map((rule) => ({
        businessId,
        ruleType: rule.ruleType,
        priority: rule.priority,
        condition: JSON.stringify(rule.condition),
        action: rule.action,
        approvalRequired: rule.approvalRequired,
        enabled: rule.enabled,
      })),
      skipDuplicates: true,
    });
  }
  if (process.env.DEMO_MODE === "true") {
    const ctx = await resolveTenantContext(userId, businessId, businessId);
    await seedElectricalDemoCatalog(ctx);
  }

  await writeAudit({
    businessId,
    userId,
    actorType: "USER",
    action: "business.created",
    entityType: "Business",
    entityId: businessId,
    metadata: { name: businessName, aiEmployee: aiEmployeeName },
  }).catch(() => undefined);
  await trackFunnel({ name: "business_created", businessId, userId }).catch(() => undefined);
  await trackFunnel({ name: "employee_created", businessId, userId }).catch(() => undefined);
}

export async function updateBusiness(ctx: TenantContext, input: PatchBusinessInput) {
  requireOwnerOrAdmin(ctx);
  const businessId = ctx.businessId;

  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.gstin !== undefined ? { gstin: input.gstin } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.defaultLanguage !== undefined
        ? { defaultLanguage: input.defaultLanguage }
        : {}),
    },
  });

  await writeAudit({
    businessId,
    userId: ctx.userId,
    actorType: "USER",
    action: "business.updated",
    entityType: "Business",
    entityId: businessId,
    metadata: input as Record<string, unknown>,
  });

  return business;
}

export async function getBusinessForUser(
  userId: string,
  requestedId?: string,
  sessionBusinessId?: string | null,
) {
  const ctx = await resolveTenantContext(userId, requestedId, sessionBusinessId);
  return loadTenantBusiness(ctx);
}

export async function updateBusinessSettings(ctx: TenantContext, input: PatchSettingsInput) {
  requireOwnerOrAdmin(ctx);
  const businessId = ctx.businessId;

  const settings = await prisma.$transaction(async (tx) => {
    const updated = await tx.businessSettings.update({
      where: { businessId },
      data: {
        ...(input.aiEnabled !== undefined ? { aiEnabled: input.aiEnabled } : {}),
        ...(input.defaultLanguage !== undefined
          ? { defaultLanguage: input.defaultLanguage }
          : {}),
        ...(input.languagesEnabled !== undefined
          ? { languagesEnabled: JSON.stringify(input.languagesEnabled) }
          : {}),
        ...(input.aiTone !== undefined ? { aiTone: input.aiTone } : {}),
        ...(input.escalationRules !== undefined
          ? { escalationRules: JSON.stringify(input.escalationRules) }
          : {}),
        ...(input.approvalRules !== undefined
          ? { approvalRules: JSON.stringify(input.approvalRules) }
          : {}),
      },
    });

    if (input.hours) {
      for (const hour of input.hours) {
        await tx.businessHours.update({
          where: {
            businessId_dayOfWeek: {
              businessId,
              dayOfWeek: hour.dayOfWeek,
            },
          },
          data: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            closed: hour.closed,
          },
        });
      }
    }

    if (input.aiTone) {
      const ai = await tx.employee.findFirst({
        where: { businessId, type: "AI" },
      });
      if (ai) {
        const personality = JSON.parse(ai.personality || "{}") as { tone?: string };
        await tx.employee.update({
          where: { id: ai.id },
          data: {
            personality: JSON.stringify({ ...personality, tone: input.aiTone }),
          },
        });
      }
    }

    return updated;
  });

  await writeAudit({
    businessId,
    userId: ctx.userId,
    actorType: "USER",
    action: "business.settings.updated",
    entityType: "BusinessSettings",
    entityId: businessId,
  });

  return settings;
}

export async function updateAiEmployee(
  ctx: TenantContext,
  input: {
    name?: string;
    avatar?: string | null;
    role?: string;
    status?: string;
    languages?: string[];
    tone?: string;
    personality?: Partial<{
      tone: string;
      attire: string;
      addressForm: string;
      greeting: string;
      verbosity: string;
      appearanceId: string;
    }>;
    pauseFor?: "15m" | "1h" | "today" | "indefinite" | "resume";
    workingHours?: Array<{
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      closed: boolean;
    }>;
    responsibilities?: { handles?: string[]; escalates?: string[] };
  },
) {
  requireOwnerOrAdmin(ctx);
  const businessId = ctx.businessId;

  const employee = await prisma.employee.findFirst({
    where: { businessId, type: "AI" },
  });
  if (!employee) {
    throw new HttpError(404, "AI employee not found.");
  }

  const personality = parsePersonality(JSON.parse(employee.personality || "{}"), "friendly");
  const responsibilities = JSON.parse(employee.responsibilities || "{}") as {
    handles?: string[];
    escalates?: string[];
  };
  const nextPersonality = parsePersonality(
    {
      ...personality,
      ...input.personality,
      tone: input.tone ?? input.personality?.tone ?? personality.tone,
      appearanceId: input.avatar ?? input.personality?.appearanceId ?? personality.appearanceId,
    },
    personality.tone,
  );
  const pause = input.pauseFor ? pauseUntilFrom(input.pauseFor) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.employee.update({
      where: { id: employee.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(pause ? { status: pause.status, pauseUntil: pause.pauseUntil } : {}),
        ...(input.languages !== undefined
          ? { languages: JSON.stringify(input.languages) }
          : {}),
        personality: JSON.stringify(nextPersonality),
        responsibilities: JSON.stringify({
          handles: input.responsibilities?.handles ?? responsibilities.handles ?? [],
          escalates: input.responsibilities?.escalates ?? responsibilities.escalates ?? [],
        }),
      },
    });

    if (input.tone || nextPersonality.tone) {
      await tx.businessSettings.update({
        where: { businessId },
        data: { aiTone: nextPersonality.tone },
      });
    }
    if (input.languages) {
      await tx.businessSettings.update({
        where: { businessId },
        data: { languagesEnabled: JSON.stringify(input.languages) },
      });
    }
    if (input.workingHours) {
      for (const hour of input.workingHours) {
        await tx.businessHours.update({
          where: {
            businessId_dayOfWeek: { businessId, dayOfWeek: hour.dayOfWeek },
          },
          data: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            closed: hour.closed,
          },
        });
      }
    }
    return next;
  });

  await writeAudit({
    businessId,
    userId: ctx.userId,
    actorType: "USER",
    action: "ai_employee.updated",
    entityType: "Employee",
    entityId: employee.id,
    metadata: { name: updated.name },
  });

  return updated;
}
