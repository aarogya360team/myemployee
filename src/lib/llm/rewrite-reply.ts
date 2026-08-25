import { isRobotic, systemStylePrompt } from "@/lib/language";
import { completeChat, llmConfigured } from "./openai";

export type ReplyFacts = {
  priceLabels: string[];
  productNames: string[];
};

const MONEY = /(?:₹|rs\.?|inr)\s*[\d,]+|\b[\d,]+\s*(?:rs|rupees)\b/gi;

export function inventedMoney(reply: string, allowedLabels: string[]) {
  const allowed = new Set(
    allowedLabels
      .flatMap((label) => [label, ...label.match(/\d[\d,]*/g)?.map((n) => n.replace(/,/g, "")) ?? []])
      .map((item) => item.replace(/[₹,\s]/g, "").toLowerCase())
      .filter(Boolean),
  );
  const hits = reply.match(MONEY) ?? [];
  if (hits.length === 0) return false;
  if (allowed.size === 0) return true;
  return hits.some((hit) => {
    const digits = (hit.match(/\d[\d,]*/)?.[0] ?? "").replace(/,/g, "");
    return digits.length > 0 && !allowed.has(digits) && !allowed.has(hit.replace(/[₹,\s]/g, "").toLowerCase());
  });
}

export async function polishEmployeeReply(input: {
  draft: string;
  language: string;
  employeeName: string;
  businessName: string;
  tone: string;
  customerText: string;
  facts: ReplyFacts;
  nextAction: string;
}): Promise<string> {
  if (!llmConfigured()) return input.draft;
  const system = [
    systemStylePrompt({
      employeeName: input.employeeName,
      businessName: input.businessName,
      tone: input.tone,
      languages: ["hi", "en", "hinglish"],
    }),
    "Rewrite the draft reply in the customer's language. Keep the same facts. Do not add prices, SKUs, tracking, or 'paid'/'delivered' unless they are already in the draft.",
    `Locked facts: ${JSON.stringify(input.facts)}`,
    `Required next action (do not skip): ${input.nextAction}`,
    `Customer said: ${input.customerText.slice(0, 500)}`,
  ].join("\n");
  const polished = await completeChat({
    system,
    user: `Draft to rewrite (keep meaning):\n${input.draft}`,
  });
  if (!polished || isRobotic(polished) || inventedMoney(polished, input.facts.priceLabels)) {
    return input.draft;
  }
  if (polished.length > 700) return input.draft;
  return polished;
}
