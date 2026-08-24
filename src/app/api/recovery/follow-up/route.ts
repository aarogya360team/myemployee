import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { sendFollowUpMessage } from "@/lib/usp/fulfillment";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const open = await prisma.recoveryOpportunity.findMany({
      where: { businessId: ctx.businessId, status: "OPEN" },
    });
    let sent = 0;
    let queued = 0;
    for (const row of open) {
      if (!row.customerId) continue;
      const result = await sendFollowUpMessage(
        ctx,
        row.customerId,
        "Aapke pending order / quote ke baare mein follow-up. Reply kijiye jab ready hon.",
      );
      if (result.sent) sent += 1;
      else queued += 1;
      await prisma.recoveryOpportunity.update({
        where: { id: row.id },
        data: { recommendedAction: result.sent ? "FOLLOW_UP_SENT" : "FOLLOW_UP_QUEUED" },
      });
    }
    return json({ queued, sent });
  } catch (error) {
    return handleError(error);
  }
}
