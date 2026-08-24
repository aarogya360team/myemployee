import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import { handleError, json } from "@/lib/http";
import { merchantWhatsAppStatus, upsertIntegration } from "@/lib/integrations";
import { trackFunnel } from "@/lib/funnel";
import { getPlatformEnv } from "@/lib/platform/env";
import { requireOwnerOrAdmin, resolveTenantContext } from "@/lib/platform/tenant";
import { setPluginEnabled } from "@/lib/platform/plugins";
import {
  exchangeEmbeddedSignupCode,
  firstPhoneNumber,
  subscribeWabaWebhooks,
} from "@/lib/providers/whatsapp";
import { z } from "zod";

const embeddedSchema = z.object({
  code: z.string().trim().min(8),
  wabaId: z.string().trim().min(4).max(80),
  phoneNumberId: z.string().trim().min(4).max(40).optional(),
  displayPhone: z.string().trim().max(24).optional(),
  existingNumber: z.boolean().optional(),
});

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
    const env = getPlatformEnv();
    const connectReady = Boolean(env.metaAppId && env.metaConfigId);
    const status = await merchantWhatsAppStatus(loaded.ctx.businessId, connectReady);
    return json({
      ...status,
      sdk: connectReady ? { appId: env.metaAppId, configId: env.metaConfigId } : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const loaded = await tenant();
    if ("error" in loaded) return loaded.error;
    const parsed = embeddedSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: "WhatsApp connection was cancelled or expired. Try again." }, 400);
    }
    const token = await exchangeEmbeddedSignupCode(parsed.data.code);
    let phoneNumberId = parsed.data.phoneNumberId;
    let displayPhone = parsed.data.displayPhone;
    if (!phoneNumberId) {
      const phone = await firstPhoneNumber(parsed.data.wabaId, token);
      phoneNumberId = phone?.id;
      displayPhone = phone?.display_phone_number ?? displayPhone;
    }
    if (!phoneNumberId) {
      return json({ error: "WhatsApp did not finish connecting. Try again." }, 400);
    }
    try {
      await subscribeWabaWebhooks(parsed.data.wabaId, token);
    } catch {
      /* webhook subscribe can be completed by the platform app */
    }
    await upsertIntegration({
      businessId: loaded.ctx.businessId,
      provider: "meta",
      type: "whatsapp",
      enabled: true,
      connectionStatus: "REAL",
      displayPhone: displayPhone ?? null,
      config: {
        phoneNumberId,
        accessToken: token,
        wabaId: parsed.data.wabaId,
        displayPhone,
        coexistence: parsed.data.existingNumber ?? true,
      },
    });
    await setPluginEnabled(loaded.ctx, "channel.whatsapp", true);
    await trackFunnel({
      name: "whatsapp_connected",
      businessId: loaded.ctx.businessId,
      userId: loaded.userId,
    });
    const env = getPlatformEnv();
    return json(
      await merchantWhatsAppStatus(loaded.ctx.businessId, Boolean(env.metaAppId && env.metaConfigId)),
    );
  } catch (error) {
    return handleError(error);
  }
}
