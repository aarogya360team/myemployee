import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const conversations = await prisma.conversation.findMany({
      where: { businessId: ctx.businessId },
      include: {
        customer: true,
        orders: { orderBy: { createdAt: "desc" }, take: 1 },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    });
    return json({
      conversations: conversations.map((row) => ({
        id: row.id,
        channel: row.channel,
        status: row.status,
        controlMode: row.controlMode,
        currentState: row.currentState,
        nextBestAction: row.nextBestAction,
        blockingReason: row.blockingReason,
        demo: row.customer?.segment === "TRYOUT" || row.customer?.phone === "TRYOUT",
        customerLabel: row.customer?.name || row.customer?.phone || "Customer",
        preview: row.messages[0]?.body ?? "",
        updatedAt: row.updatedAt,
        orderStatus: row.orders[0]?.status ?? null,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

const takeoverSchema = z.object({
  conversationId: z.string(),
  controlMode: z.enum(["AI", "HUMAN"]),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const parsed = takeoverSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid takeover." }, 400);
    const existing = await prisma.conversation.findFirst({
      where: { id: parsed.data.conversationId, businessId: ctx.businessId },
    });
    if (!existing) return json({ error: "Conversation not found." }, 404);
    const updated = await prisma.conversation.update({
      where: { id: existing.id },
      data: {
        controlMode: parsed.data.controlMode,
        currentState: parsed.data.controlMode === "HUMAN" ? "HUMAN_HANDLED" : existing.currentState,
      },
    });
    return json({ conversation: updated });
  } catch (error) {
    return handleError(error);
  }
}
