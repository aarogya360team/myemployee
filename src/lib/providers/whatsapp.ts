import { getPlatformEnv } from "@/lib/platform/env";
import type { MessagingProvider } from "./types";
import { whatsappTo } from "./phone";

const GRAPH = "https://graph.facebook.com";

function version() {
  return getPlatformEnv().metaApiVersion;
}

export function cloudWhatsApp(config: { phoneNumberId: string; accessToken: string }): MessagingProvider {
  return {
    async sendMessage(to, text) {
      const res = await fetch(`${GRAPH}/${version()}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: whatsappTo(to),
          type: "text",
          text: { preview_url: false, body: text.slice(0, 4096) },
        }),
      });
      const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
      if (!res.ok || !data.messages?.[0]?.id) {
        return { ok: false, id: data.error?.message ?? "whatsapp_send_failed" };
      }
      return { ok: true, id: data.messages[0].id };
    },
    async sendDocument(to, url, filename) {
      const res = await fetch(`${GRAPH}/${version()}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: whatsappTo(to),
          type: "document",
          document: { link: url, filename: filename ?? "invoice.pdf" },
        }),
      });
      const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
      if (!res.ok || !data.messages?.[0]?.id) {
        return { ok: false, id: data.error?.message ?? "whatsapp_doc_failed" };
      }
      return { ok: true, id: data.messages[0].id };
    },
  };
}

export async function exchangeEmbeddedSignupCode(code: string) {
  const env = getPlatformEnv();
  if (!env.metaAppId || !env.metaAppSecret) {
    throw new Error("Meta app id and secret are not set on the platform.");
  }
  const url = new URL(`${GRAPH}/${env.metaApiVersion}/oauth/access_token`);
  url.searchParams.set("client_id", env.metaAppId);
  url.searchParams.set("client_secret", env.metaAppSecret);
  url.searchParams.set("code", code);
  const res = await fetch(url);
  const data = (await res.json()) as { access_token?: string; error?: { message: string } };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Could not exchange the Meta signup code.");
  }
  return data.access_token;
}

export async function debugWhatsAppToken(accessToken: string) {
  const env = getPlatformEnv();
  if (!env.metaAppId || !env.metaAppSecret) return null;
  const appToken = `${env.metaAppId}|${env.metaAppSecret}`;
  const url = new URL(`${GRAPH}/${env.metaApiVersion}/debug_token`);
  url.searchParams.set("input_token", accessToken);
  url.searchParams.set("access_token", appToken);
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<{ data?: { granular_scopes?: { scope: string; target_ids?: string[] }[] } }>;
}

export async function listOwnedWabas(accessToken: string) {
  const env = getPlatformEnv();
  const url = new URL(`${GRAPH}/${env.metaApiVersion}/debug_token`);
  // Shared numbers come back from the embedded signup session payload; this is a fallback.
  const me = await fetch(`${GRAPH}/${env.metaApiVersion}/me/businesses?access_token=${accessToken}`);
  if (!me.ok) return [];
  const data = (await me.json()) as { data?: { id: string }[] };
  return data.data ?? [];
}

export async function firstPhoneNumber(wabaId: string, accessToken: string) {
  const env = getPlatformEnv();
  const res = await fetch(
    `${GRAPH}/${env.metaApiVersion}/${wabaId}/phone_numbers?access_token=${encodeURIComponent(accessToken)}`,
  );
  const data = (await res.json()) as {
    data?: { id: string; display_phone_number?: string }[];
    error?: { message: string };
  };
  if (!res.ok || !data.data?.[0]) return null;
  return data.data[0];
}

export async function subscribeWabaWebhooks(wabaId: string, accessToken: string) {
  const env = getPlatformEnv();
  const res = await fetch(`${GRAPH}/${env.metaApiVersion}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: { message: string } };
    throw new Error(data.error?.message ?? "Could not subscribe WhatsApp webhooks.");
  }
}
