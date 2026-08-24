import { NextRequest } from "next/server";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { findBusinessByWhatsAppPhoneNumberId } from "@/lib/integrations";
import { getPlatformEnv } from "@/lib/platform/env";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";
import { nationalMobile } from "@/lib/providers/phone";
import { processCustomerTurn } from "@/lib/usp/handle-turn";
import { createHmac, timingSafeEqual } from "crypto";

export async function GET(request: NextRequest) {
  const env = getPlatformEnv();
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env.metaWebhookVerifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return json({ error: "WhatsApp webhook verify failed." }, 403);
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const env = getPlatformEnv();
  if (env.metaAppSecret) {
    const header = request.headers.get("x-hub-signature-256") ?? "";
    const expected = `sha256=${createHmac("sha256", env.metaAppSecret).update(raw).digest("hex")}`;
    if (!safeEqual(header, expected)) {
      return json({ error: "Bad signature." }, 401);
    }
  }

  let payload: WebhookBody;
  try {
    payload = JSON.parse(raw) as WebhookBody;
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const messages = flattenMessages(payload);
  for (const item of messages) {
    try {
      await handleInbound(item);
    } catch (error) {
      console.error("whatsapp inbound", error);
    }
  }
  return json({ ok: true });
}

async function handleInbound(item: Inbound) {
  const businessId = await findBusinessByWhatsAppPhoneNumberId(item.phoneNumberId);
  if (!businessId) return;
  if (item.type !== "text" || !item.text) {
    const wa = await import("@/lib/providers/whatsapp");
    const { getWhatsAppConfig } = await import("@/lib/integrations");
    const config = await getWhatsAppConfig(businessId);
    if (config) {
      await wa.cloudWhatsApp(config).sendMessage(
        item.from,
        "Please send the item as text — brand, watt/size, and quantity. I only quote from our catalogue.",
      );
    }
    return;
  }

  const owner = await prisma.businessMembership.findFirst({
    where: { businessId, role: "OWNER" },
    include: { user: true },
  });
  if (!owner) return;
  const ctx = await resolveTenantContext(owner.userId, businessId, businessId);
  const business = await prisma.business.findFirst({ where: { id: businessId } });
  const employee = await getAiEmployee(ctx);
  if (!business || !employee) return;
  const ai = serializeEmployee(employee);
  const result = await processCustomerTurn({
    ctx,
    userId: owner.userId,
    businessName: business.name,
    employeeName: ai.name,
    employeeId: employee.id,
    text: item.text,
    channel: "whatsapp",
    customerPhone: nationalMobile(item.from),
  });
  if (result.muted) return;
  const { getWhatsAppConfig } = await import("@/lib/integrations");
  const { cloudWhatsApp } = await import("@/lib/providers/whatsapp");
  const config = await getWhatsAppConfig(businessId);
  if (!config) return;
  await cloudWhatsApp(config).sendMessage(item.from, result.reply);
}

function flattenMessages(payload: WebhookBody): Inbound[] {
  const out: Inbound[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = change.value?.metadata?.phone_number_id;
      for (const message of change.value?.messages ?? []) {
        if (!phoneNumberId || !message.from) continue;
        out.push({
          phoneNumberId,
          from: message.from,
          type: message.type ?? "text",
          text: message.text?.body,
          id: message.id,
        });
      }
    }
  }
  return out;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

type Inbound = {
  phoneNumberId: string;
  from: string;
  type: string;
  text?: string;
  id?: string;
};

type WebhookBody = {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: {
          from?: string;
          id?: string;
          type?: string;
          text?: { body?: string };
        }[];
      };
    }[];
  }[];
};
