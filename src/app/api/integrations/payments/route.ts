import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { getRazorpayConfig, upsertIntegration } from "@/lib/integrations";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { setPluginEnabled } from "@/lib/platform/plugins";
import { z } from "zod";

const schema = z.object({
  keyId: z.string().trim().min(8).max(80),
  keySecret: z.string().trim().min(8).max(80),
  webhookSecret: z.string().trim().max(80).optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const live = await getRazorpayConfig(ctx.businessId);
    return json({
      connected: Boolean(live),
      keyId: live ? `${live.keyId.slice(0, 8)}…` : null,
      webhookUrl: `${(process.env.APP_URL || "https://aurel-employee.vercel.app").replace(/\/$/, "")}/api/webhooks/razorpay`,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    requireOwnerOrAdmin(ctx);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Razorpay Key ID and Key Secret are required." }, 400);
    await upsertIntegration({
      businessId: ctx.businessId,
      provider: "razorpay",
      type: "payments",
      enabled: true,
      config: parsed.data,
    });
    await setPluginEnabled(ctx, "ops.payments", true);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
