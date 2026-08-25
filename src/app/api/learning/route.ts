import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { learningStats } from "@/lib/learning";
import { resolveTenantContext } from "@/lib/platform/tenant";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    try {
      const learning = await learningStats(ctx.businessId);
      return json({ learning });
    } catch {
      return json({
        learning: { humanReplies: 0, aiSuccesses: 0, skillsUnlocked: [] as string[], readyForMore: false, total: 0 },
      });
    }
  } catch (error) {
    return handleError(error);
  }
}
