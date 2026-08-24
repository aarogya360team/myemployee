import { json, handleError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getSessionState } from "@/lib/auth";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({ status: z.enum(["DISMISSED", "OPEN"]) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid status." }, 400);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const row = await prisma.recoveryOpportunity.findFirst({
      where: { id, businessId: ctx.businessId },
    });
    if (!row) return json({ error: "Not found." }, 404);
    const updated = await prisma.recoveryOpportunity.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return json({ opportunity: updated });
  } catch (error) {
    return handleError(error);
  }
}
