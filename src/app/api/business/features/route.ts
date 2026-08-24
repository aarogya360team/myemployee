import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { listFeaturesForTenant, setPluginEnabled } from "@/lib/platform/plugins";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    const features = await listFeaturesForTenant(ctx);
    return json({ features });
  } catch (error) {
    return handleError(error);
  }
}

const patchSchema = z.object({
  pluginId: z.string().min(1),
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Invalid feature update." }, 400);
    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    requireOwnerOrAdmin(ctx);
    await setPluginEnabled(ctx, parsed.data.pluginId, parsed.data.enabled);
    const features = await listFeaturesForTenant(ctx);
    return json({ features });
  } catch (error) {
    return handleError(error);
  }
}
