import { detectIntent } from "@/lib/language";
import { recordLearningExample, learningStats } from "@/lib/learning";
import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function loadConversation(userId: string, activeBusinessId: string | null | undefined, id: string) {
  const ctx = await resolveTenantContext(userId, null, activeBusinessId);
  const conversation = await prisma.conversation.findFirst({
    where: { id, businessId: ctx.businessId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
      orders: {
        include: { payments: true, deliveries: true, invoices: true, items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return { ctx, conversation };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const { conversation } = await loadConversation(session.user.id, session.activeBusinessId, id);
    if (!conversation) return json({ error: "Conversation not found." }, 404);
    return json({ conversation });
  } catch (error) {
    return handleError(error);
  }
}

const patchSchema = z.object({
  controlMode: z.enum(["AI", "HUMAN"]),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid." }, 400);
    const { ctx, conversation } = await loadConversation(session.user.id, session.activeBusinessId, id);
    if (!conversation) return json({ error: "Conversation not found." }, 404);
    requireOwnerOrAdmin(ctx);
    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        controlMode: parsed.data.controlMode,
        currentState: parsed.data.controlMode === "HUMAN" ? "HUMAN_HANDLED" : conversation.currentState,
      },
    });
    return json({ conversation: updated });
  } catch (error) {
    return handleError(error);
  }
}

const replySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Message chahiye." }, 400);
    const { ctx, conversation } = await loadConversation(session.user.id, session.activeBusinessId, id);
    if (!conversation) return json({ error: "Conversation not found." }, 404);
    requireOwnerOrAdmin(ctx);
    if (conversation.controlMode !== "HUMAN") {
      return json({ error: "Take over first, then reply." }, 400);
    }
    const message = await prisma.message.create({
      data: { conversationId: conversation.id, sender: "owner", body: parsed.data.text },
    });
    const customerMsgs = conversation.messages.filter((row) => row.sender === "customer");
    const last = customerMsgs.at(-1)?.body ?? "";
    const prev = customerMsgs.at(-2)?.body ?? "";
    const customerText = last.length < 12 && prev ? `${prev}\n${last}` : last;
    let learned = false;
    try {
      await recordLearningExample({
        businessId: ctx.businessId,
        source: "HUMAN",
        intent: detectIntent(last || parsed.data.text),
        customerText: customerText || parsed.data.text,
        reply: parsed.data.text,
        journeyState: conversation.currentState,
        nextAction: conversation.nextBestAction,
      });
      learned = true;
    } catch {
      learned = false;
    }
    let learning = null;
    try {
      learning = await learningStats(ctx.businessId);
    } catch {
      learning = null;
    }
    return json({ message, learned, learning });
  } catch (error) {
    return handleError(error);
  }
}
