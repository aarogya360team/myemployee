import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { upsertIntegration } from "@/lib/integrations";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { setPluginEnabled } from "@/lib/platform/plugins";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().trim().min(4).max(120),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Shiprocket email and password are required." }, 400);
    await upsertIntegration({
      businessId: ctx.businessId,
      provider: "shiprocket",
      type: "delivery",
      enabled: true,
      config: parsed.data,
    });
    await setPluginEnabled(ctx, "ops.delivery", true);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
