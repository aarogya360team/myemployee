export function tokenize(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1),
  );
}

export function overlapScore(query: string, candidate: string) {
  const a = tokenize(query);
  const b = tokenize(candidate);
  if (a.size === 0 || b.size === 0) return 0;
  let hit = 0;
  for (const token of a) {
    if (b.has(token)) hit += 1;
  }
  return hit / Math.max(a.size, 3);
}

export type RankedExample = {
  customerText: string;
  reply: string;
  source: string;
  intent: string;
  weight: number;
  score: number;
};

export function rankExamples(
  query: string,
  rows: Array<{ customerText: string; reply: string; source: string; intent: string; weight: number }>,
  limit = 6,
): RankedExample[] {
  return rows
    .map((row) => ({
      ...row,
      score: overlapScore(query, `${row.customerText} ${row.intent}`) * (row.source === "HUMAN" ? 2.5 : 1) * Math.min(row.weight, 8),
    }))
    .filter((row) => row.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function skillSummary(rows: Array<{ source: string; intent: string }>) {
  const human = rows.filter((row) => row.source === "HUMAN").length;
  const ai = rows.filter((row) => row.source === "AI_SUCCESS").length;
  const intents = new Set(rows.filter((row) => row.source === "HUMAN").map((row) => row.intent));
  return {
    humanReplies: human,
    aiSuccesses: ai,
    skillsUnlocked: [...intents],
    readyForMore: human >= 3,
  };
}
