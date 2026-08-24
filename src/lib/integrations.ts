import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/tenant";
import { decryptSecret, encryptSecret, maskPhone } from "@/lib/crypto/secrets";
import type { ConnectionHealth } from "@/lib/providers/whatsapp-provider";

export type WhatsAppConfig = {
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
  displayPhone?: string;
  coexistence?: boolean;
};

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
};

export type ShiprocketConfig = {
  email: string;
  password: string;
};

function encryptWhatsApp(config: WhatsAppConfig): WhatsAppConfig {
  return {
    ...config,
    accessToken:
      config.accessToken && !config.accessToken.startsWith("enc:")
        ? encryptSecret(config.accessToken)
        : config.accessToken,
  };
}

function decryptWhatsApp(config: WhatsAppConfig): WhatsAppConfig {
  return {
    ...config,
    accessToken: config.accessToken ? decryptSecret(config.accessToken) : config.accessToken,
  };
}

export async function getIntegration<T>(businessId: string, provider: string, type: string) {
  const row = await prisma.integration.findUnique({
    where: { businessId_provider_type: { businessId, provider, type } },
  });
  if (!row?.enabled) return null;
  return { ...row, config: parseJson<T>(row.config, {} as T) };
}

export async function upsertIntegration(input: {
  businessId: string;
  provider: string;
  type: string;
  enabled: boolean;
  config: unknown;
  connectionStatus?: ConnectionHealth;
  displayPhone?: string | null;
}) {
  const config =
    input.provider === "meta" && input.type === "whatsapp"
      ? encryptWhatsApp(input.config as WhatsAppConfig)
      : input.config;
  const live = input.enabled && input.connectionStatus !== "NOT_CONNECTED";
  return prisma.integration.upsert({
    where: {
      businessId_provider_type: {
        businessId: input.businessId,
        provider: input.provider,
        type: input.type,
      },
    },
    update: {
      enabled: input.enabled,
      config: JSON.stringify(config),
      connectionStatus: input.connectionStatus ?? (input.enabled ? "REAL" : "NOT_CONNECTED"),
      displayPhone: input.displayPhone ?? undefined,
      connectedAt: live ? new Date() : null,
    },
    create: {
      businessId: input.businessId,
      provider: input.provider,
      type: input.type,
      enabled: input.enabled,
      config: JSON.stringify(config),
      connectionStatus: input.connectionStatus ?? (input.enabled ? "REAL" : "NOT_CONNECTED"),
      displayPhone: input.displayPhone ?? undefined,
      connectedAt: live ? new Date() : null,
    },
  });
}

export async function findBusinessByWhatsAppPhoneNumberId(phoneNumberId: string) {
  const rows = await prisma.integration.findMany({
    where: { provider: "meta", type: "whatsapp", enabled: true },
  });
  for (const row of rows) {
    const config = parseJson<WhatsAppConfig>(row.config, { phoneNumberId: "", accessToken: "" });
    if (config.phoneNumberId === phoneNumberId) return row.businessId;
  }
  return null;
}

export async function getWhatsAppConfig(businessId: string) {
  const row = await getIntegration<WhatsAppConfig>(businessId, "meta", "whatsapp");
  if (!row?.config.phoneNumberId || !row.config.accessToken) return null;
  return decryptWhatsApp(row.config);
}

export async function getRazorpayConfig(businessId: string) {
  const row = await getIntegration<RazorpayConfig>(businessId, "razorpay", "payments");
  if (!row?.config.keyId || !row.config.keySecret) return null;
  return row.config;
}

export async function getShiprocketConfig(businessId: string) {
  const row = await getIntegration<ShiprocketConfig>(businessId, "shiprocket", "delivery");
  if (!row?.config.email || !row.config.password) return null;
  return row.config;
}

export async function merchantWhatsAppStatus(businessId: string, connectReady: boolean) {
  const row = await prisma.integration.findUnique({
    where: { businessId_provider_type: { businessId, provider: "meta", type: "whatsapp" } },
  });
  const live = row?.enabled && row.connectionStatus === "REAL";
  return {
    health: (live ? "REAL" : "NOT_CONNECTED") as ConnectionHealth,
    connected: Boolean(live),
    displayPhone: live ? maskPhone(row?.displayPhone) : null,
    connectReady,
    merchantMessage: live
      ? "WhatsApp connected."
      : connectReady
        ? "Connect the number customers already WhatsApp."
        : "Rahul cannot currently access WhatsApp. You can still test him here.",
  };
}

export async function connectionStatus(businessId: string) {
  const [whatsapp, payments, delivery, products] = await Promise.all([
    getWhatsAppConfig(businessId),
    getRazorpayConfig(businessId),
    getShiprocketConfig(businessId),
    prisma.product.count({ where: { businessId, active: true } }),
  ]);
  return {
    whatsapp: Boolean(whatsapp),
    payments: Boolean(payments),
    delivery: Boolean(delivery),
    catalogue: products > 0,
    productCount: products,
  };
}
