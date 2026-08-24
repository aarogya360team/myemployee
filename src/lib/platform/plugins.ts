import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/tenant";
import type { TenantContext } from "./tenant";

export type PluginKind = "core" | "channel" | "ops" | "addon";

export type PlatformPlugin = {
  id: string;
  name: string;
  summary: string;
  kind: PluginKind;
  core: boolean;
  defaultEnabled: boolean;
};

/**
 * Platform catalog. Code owns the plugin list.
 * Each shop only sees/enables rows in BusinessFeature for its own businessId.
 */
export const PLATFORM_PLUGINS: PlatformPlugin[] = [
  {
    id: "core.employee",
    name: "AI employee",
    summary: "Named AI employee who completes sales for this shop only",
    kind: "core",
    core: true,
    defaultEnabled: true,
  },
  {
    id: "core.catalog",
    name: "Product catalogue",
    summary: "Products and prices for this shop",
    kind: "core",
    core: true,
    defaultEnabled: true,
  },
  {
    id: "core.orders",
    name: "Orders",
    summary: "Drafts, confirmation, and order records",
    kind: "core",
    core: true,
    defaultEnabled: true,
  },
  {
    id: "channel.whatsapp",
    name: "WhatsApp",
    summary: "Customer chat on WhatsApp Business",
    kind: "channel",
    core: false,
    defaultEnabled: false,
  },
  {
    id: "channel.voice",
    name: "Voice calls",
    summary: "Phone conversations with the AI employee",
    kind: "channel",
    core: false,
    defaultEnabled: false,
  },
  {
    id: "ops.delivery",
    name: "Delivery booking",
    summary: "Quotes and tracking through a delivery provider",
    kind: "ops",
    core: false,
    defaultEnabled: false,
  },
  {
    id: "ops.payments",
    name: "Payments",
    summary: "Payment links and status checks",
    kind: "ops",
    core: false,
    defaultEnabled: false,
  },
  {
    id: "ops.gst",
    name: "GST invoices",
    summary: "GST fields on bills (no tax advice)",
    kind: "ops",
    core: false,
    defaultEnabled: false,
  },
  {
    id: "addon.custom_fields",
    name: "Custom catalog fields",
    summary: "Extra product fields this shop needs",
    kind: "addon",
    core: false,
    defaultEnabled: false,
  },
];

export function defaultFeatureRows() {
  return PLATFORM_PLUGINS.map((plugin) => ({
    pluginId: plugin.id,
    enabled: plugin.defaultEnabled,
    config: "{}",
  }));
}

export async function listFeaturesForTenant(ctx: TenantContext) {
  const rows = await prisma.businessFeature.findMany({
    where: { businessId: ctx.businessId },
  });
  const byId = new Map(rows.map((row) => [row.pluginId, row]));
  return PLATFORM_PLUGINS.map((plugin) => {
    const row = byId.get(plugin.id);
    return {
      ...plugin,
      enabled: row?.enabled ?? plugin.defaultEnabled,
      config: row?.config ? safeJson(row.config) : {},
    };
  });
}

export async function isPluginEnabled(ctx: TenantContext, pluginId: string) {
  const plugin = PLATFORM_PLUGINS.find((item) => item.id === pluginId);
  if (!plugin) return false;
  if (plugin.core) return true;
  const row = await prisma.businessFeature.findUnique({
    where: {
      businessId_pluginId: { businessId: ctx.businessId, pluginId },
    },
  });
  return row?.enabled === true;
}

export async function requirePlugin(ctx: TenantContext, pluginId: string) {
  const enabled = await isPluginEnabled(ctx, pluginId);
  if (!enabled) {
    throw new HttpError(403, "This feature is not enabled for your business.");
  }
}

export async function setPluginEnabled(
  ctx: TenantContext,
  pluginId: string,
  enabled: boolean,
) {
  const plugin = PLATFORM_PLUGINS.find((item) => item.id === pluginId);
  if (!plugin) {
    throw new HttpError(404, "Unknown feature.");
  }
  if (plugin.core && !enabled) {
    throw new HttpError(400, "Core platform features cannot be turned off.");
  }
  return prisma.businessFeature.upsert({
    where: {
      businessId_pluginId: { businessId: ctx.businessId, pluginId },
    },
    update: { enabled },
    create: {
      businessId: ctx.businessId,
      pluginId,
      enabled,
      config: "{}",
    },
  });
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
