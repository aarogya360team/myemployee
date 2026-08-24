import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { saveOnboardingProgress } from "@/lib/onboarding";
import { trackFunnel } from "@/lib/funnel";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { z } from "zod";

const schema = z.object({
  path: z.enum(["EXISTING", "NEW", "UNSURE"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Choose how WhatsApp should work." }, 400);
    await saveOnboardingProgress(ctx, {
      whatsappPath: parsed.data.path,
      json: { whatsappPath: parsed.data.path },
    });
    await trackFunnel({ name: "whatsapp_setup_started", businessId: ctx.businessId, userId: session.user.id });
    const copy =
      parsed.data.path === "NEW"
        ? "A new number for your employee is not available yet. Use the number customers already WhatsApp."
        : parsed.data.path === "UNSURE"
          ? "If customers already WhatsApp you, connect that number."
          : "Connect the number customers already WhatsApp.";
    return json({ path: parsed.data.path, merchantMessage: copy });
  } catch (error) {
    return handleError(error);
  }
}
