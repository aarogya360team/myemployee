import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { getOnboardingSnapshot, markGoLive, saveOnboardingProgress } from "@/lib/onboarding";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { onboardingPatchSchema } from "@/lib/validators";

async function tenant() {
  const session = await getSessionState();
  if (!session) return { error: json({ error: "Please sign in." }, 401) };
  const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
  requireOwnerOrAdmin(ctx);
  return { ctx, userId: session.user.id };
}

export async function GET() {
  try {
    const loaded = await tenant();
    if ("error" in loaded) return loaded.error;
    return json(await getOnboardingSnapshot(loaded.ctx));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const loaded = await tenant();
    if ("error" in loaded) return loaded.error;
    const parsed = onboardingPatchSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: "Could not save setup progress." }, 400);
    await saveOnboardingProgress(loaded.ctx, parsed.data);
    return json(await getOnboardingSnapshot(loaded.ctx));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST() {
  try {
    const loaded = await tenant();
    if ("error" in loaded) return loaded.error;
    return json(await markGoLive(loaded.ctx, loaded.userId));
  } catch (error) {
    return handleError(error);
  }
}
