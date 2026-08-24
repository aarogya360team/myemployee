import { NextRequest } from "next/server";
import { getSessionState, setActiveBusinessForUser } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { z } from "zod";

const schema = z.object({
  businessId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "businessId is required." }, 400);
    const ctx = await resolveTenantContext(session.user.id, parsed.data.businessId);
    await setActiveBusinessForUser(ctx.userId, ctx.businessId);
    return json({ ok: true, businessId: ctx.businessId });
  } catch (error) {
    return handleError(error);
  }
}
