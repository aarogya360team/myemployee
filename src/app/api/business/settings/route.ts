import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { getBusinessForUser, updateBusinessSettings } from "@/lib/business";
import { handleError, json } from "@/lib/http";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { parseJson } from "@/lib/tenant";
import { patchSettingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const business = await getBusinessForUser(
      session.user.id,
      undefined,
      session.activeBusinessId,
    );
    if (!business.settings) return json({ error: "Settings not found." }, 404);
    return json({
      settings: {
        ...business.settings,
        languagesEnabled: parseJson<string[]>(business.settings.languagesEnabled, [
          "hinglish",
        ]),
        escalationRules: parseJson(business.settings.escalationRules, {}),
        approvalRules: parseJson(business.settings.approvalRules, {}),
      },
      hours: business.hours,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const body = await request.json();
    const parsed = patchSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Invalid settings update." }, 400);
    }
    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    await updateBusinessSettings(ctx, parsed.data);
    const fresh = await getBusinessForUser(
      session.user.id,
      ctx.businessId,
      ctx.businessId,
    );
    return json({
      settings: fresh.settings
        ? {
            ...fresh.settings,
            languagesEnabled: parseJson<string[]>(fresh.settings.languagesEnabled, [
              "hinglish",
            ]),
            escalationRules: parseJson(fresh.settings.escalationRules, {}),
            approvalRules: parseJson(fresh.settings.approvalRules, {}),
          }
        : null,
      hours: fresh.hours,
    });
  } catch (error) {
    return handleError(error);
  }
}
