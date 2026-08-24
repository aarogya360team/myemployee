import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["RESOLVED", "HUMAN_HANDLED", "OPEN"]),
  takeOver: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const row = await prisma.escalation.findFirst({ where: { id, businessId: ctx.businessId } });
    if (!row) return json({ error: "Not found." }, 404);
    if (parsed.data.takeOver && row.conversationId) {
      await prisma.conversation.update({
        where: { id: row.conversationId },
        data: { controlMode: "HUMAN", currentState: "HUMAN_HANDLED" },
      });
    }
    const updated = await prisma.escalation.update({
      where: { id },
      data: {
        status: parsed.data.status,
        resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : row.resolvedAt,
        assignedTo: parsed.data.takeOver ? session.user.id : row.assignedTo,
      },
    });
    return json({ escalation: updated });
  } catch (error) {
    return handleError(error);
  }
}
