import { json, handleError } from "@/lib/http";
import { getSessionState } from "@/lib/auth";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { markDeliveredByProvider } from "@/lib/usp/fulfillment";
import { NextRequest } from "next/server";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const { id } = await context.params;
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const delivery = await markDeliveredByProvider(ctx, id);
    return json({ delivery, mock: true });
  } catch (error) {
    return handleError(error);
  }
}
