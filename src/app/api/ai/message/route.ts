import { NextRequest } from "next/server";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import type { AppLanguage } from "@/lib/constants";
import { loadTenantBusiness, resolveTenantContext } from "@/lib/platform/tenant";
import { processOwnerTryoutTurn } from "@/lib/usp/handle-turn";
import { z } from "zod";

const schema = z.object({
  text: z.string().trim().min(1).max(2000),
  channel: z.enum(["whatsapp", "web", "phone", "instagram"]).default("web"),
  previousLanguage: z.enum(["hi", "en", "hinglish"]).optional(),
  conversationId: z.string().optional(),
  customerPhone: z.string().trim().max(20).optional(),
  customerName: z.string().trim().max(80).optional(),
  simulate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Message chahiye." }, 400);

    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    const business = await loadTenantBusiness(ctx);
    const employee = await getAiEmployee(ctx);
    if (!employee) return json({ error: "AI employee not found." }, 404);
    const ai = serializeEmployee(employee);

    const result = await processOwnerTryoutTurn({
      ctx,
      userId: session.user.id,
      businessName: business.name,
      employeeName: ai.name,
      employeeId: employee.id,
      text: parsed.data.text,
      channel: parsed.data.channel,
      previousLanguage: parsed.data.previousLanguage as AppLanguage | undefined,
      conversationId: parsed.data.conversationId,
      customerPhone: parsed.data.customerPhone,
      customerName: parsed.data.customerName,
      simulate: parsed.data.simulate,
    });

    return json({
      language: result.language,
      intent: result.intent,
      reply: result.reply,
      voice: result.voice,
      escalate: result.escalate,
      conversationId: result.conversationId,
      payment: "payment" in result ? result.payment : null,
      delivery: "delivery" in result ? result.delivery : null,
      learning: "learning" in result ? result.learning : null,
      debug: {
        currentState: result.currentState,
        nextBestAction: result.nextBestAction,
        missingInformation: result.missingInformation,
        blockingReason: result.blockingReason,
        confidence: result.confidence,
        reason: result.reason,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
