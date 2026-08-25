import { prisma } from "@/lib/prisma";
import { rankExamples, skillSummary } from "./rank";

export async function recordLearningExample(input: {
  businessId: string;
  source: "HUMAN" | "AI_SUCCESS";
  intent: string;
  customerText: string;
  reply: string;
  journeyState?: string | null;
  nextAction?: string | null;
}) {
  const customerText = input.customerText.trim().slice(0, 800);
  const reply = input.reply.trim().slice(0, 800);
  if (customerText.length < 2 || reply.length < 2) return;
  await prisma.learningExample.create({
    data: {
      businessId: input.businessId,
      source: input.source,
      intent: input.intent.slice(0, 40),
      customerText,
      reply,
      journeyState: input.journeyState ?? null,
      nextAction: input.nextAction ?? null,
      weight: input.source === "HUMAN" ? 5 : 1,
    },
  });
}

export async function similarShopExamples(businessId: string, customerText: string) {
  const rows = await prisma.learningExample.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      customerText: true,
      reply: true,
      source: true,
      intent: true,
      weight: true,
    },
  });
  return rankExamples(customerText, rows);
}

export async function learningStats(businessId: string) {
  const rows = await prisma.learningExample.findMany({
    where: { businessId },
    select: { source: true, intent: true },
  });
  return { ...skillSummary(rows), total: rows.length };
}
