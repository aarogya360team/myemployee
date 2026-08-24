import {
  DEFAULT_AI_ROLE,
  DEFAULT_APPROVAL_RULES,
  DEFAULT_ESCALATION_RULES,
  DEFAULT_RESPONSIBILITIES,
} from "./constants";
import {
  DEFAULT_PERSONALITY,
  parsePersonality,
  type EmployeePersonality,
} from "./employee-identity";
import { prisma } from "./prisma";
import { parseJson } from "./tenant";
import type { TenantContext } from "./platform/tenant";
import type { Prisma } from "@prisma/client";

export type Responsibilities = {
  handles: string[];
  escalates: string[];
};

export type Personality = EmployeePersonality;

export function defaultAiEmployeeData(
  name: string,
  languages: string[],
  tone: string,
  extra?: { avatar?: string; personality?: Partial<EmployeePersonality> },
) {
  const personality = parsePersonality(
    { ...DEFAULT_PERSONALITY, tone, ...extra?.personality, appearanceId: extra?.personality?.appearanceId ?? extra?.avatar ?? DEFAULT_PERSONALITY.appearanceId },
    tone,
  );
  return {
    name,
    avatar: extra?.avatar ?? personality.appearanceId,
    role: DEFAULT_AI_ROLE,
    type: "AI",
    status: "SETUP_REQUIRED",
    languages: JSON.stringify(languages),
    personality: JSON.stringify(personality),
    responsibilities: JSON.stringify(DEFAULT_RESPONSIBILITIES),
    workforceRole: "SALES",
  };
}

export async function getAiEmployee(ctx: TenantContext) {
  return prisma.employee.findFirst({
    where: { businessId: ctx.businessId, type: "AI" },
    orderBy: { createdAt: "asc" },
  });
}

export function serializeEmployee(employee: {
  id: string;
  businessId: string;
  name: string;
  avatar: string | null;
  role: string;
  type: string;
  status: string;
  pauseUntil?: Date | null;
  languages: string;
  personality: string;
  responsibilities: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const personality = parsePersonality(parseJson(employee.personality, {}), "friendly");
  const responsibilities = parseJson<Responsibilities>(employee.responsibilities, {
    handles: [...DEFAULT_RESPONSIBILITIES.handles],
    escalates: [...DEFAULT_RESPONSIBILITIES.escalates],
  });
  return {
    ...employee,
    pauseUntil: employee.pauseUntil ?? null,
    languages: parseJson<string[]>(employee.languages, ["hinglish"]),
    personality,
    responsibilities,
    tone: personality.tone ?? "friendly",
  };
}

export async function getAiEmployeeStats(ctx: TenantContext) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const [conversations, orders, invoices, followUps] = await Promise.all([
    prisma.conversation.count({ where: { businessId: ctx.businessId, createdAt: { gte: since } } }),
    prisma.order.count({ where: { businessId: ctx.businessId, createdAt: { gte: since } } }),
    prisma.shopInvoice.count({ where: { businessId: ctx.businessId, createdAt: { gte: since } } }),
    prisma.timelineEvent.count({
      where: { businessId: ctx.businessId, createdAt: { gte: since }, kind: "FOLLOW_UP" },
    }),
  ]);
  return { conversations, orders, invoices, followUps };
}

export const defaultSettingsCreate = (
  languages: string[],
  tone: string,
  defaultLanguage: string,
): Prisma.BusinessSettingsCreateWithoutBusinessInput => ({
  aiEnabled: true,
  defaultLanguage,
  languagesEnabled: JSON.stringify(languages),
  aiTone: tone,
  escalationRules: JSON.stringify(DEFAULT_ESCALATION_RULES),
  approvalRules: JSON.stringify(DEFAULT_APPROVAL_RULES),
});
