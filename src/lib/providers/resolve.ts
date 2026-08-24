import { HttpError } from "@/lib/tenant";
import { getPlatformEnv } from "@/lib/platform/env";
import { getRazorpayConfig, getShiprocketConfig, getWhatsAppConfig } from "@/lib/integrations";
import { mockDelivery, mockPayments, mockWhatsApp } from "./mocks";
import { razorpayPayments } from "./razorpay";
import { shiprocketDelivery } from "./shiprocket";
import { cloudWhatsApp } from "./whatsapp";
import type { DeliveryProvider, MessagingProvider, PaymentProvider } from "./types";

export async function messagingFor(businessId: string): Promise<MessagingProvider> {
  const live = await getWhatsAppConfig(businessId);
  if (live) return cloudWhatsApp(live);
  if (getPlatformEnv().demoMode) return mockWhatsApp;
  throw new HttpError(409, "WhatsApp Cloud API is not connected. Open Go live and connect the shop number.");
}

export async function paymentsFor(businessId: string): Promise<PaymentProvider> {
  const live = await getRazorpayConfig(businessId);
  if (live) return razorpayPayments(live);
  if (getPlatformEnv().demoMode) return mockPayments;
  throw new HttpError(409, "Razorpay is not connected. Open Go live and add the shop’s Razorpay keys.");
}

export async function deliveryFor(businessId: string): Promise<DeliveryProvider> {
  const live = await getShiprocketConfig(businessId);
  if (live) return shiprocketDelivery(live);
  if (getPlatformEnv().demoMode) return mockDelivery;
  throw new HttpError(409, "Shiprocket is not connected. Open Go live and add the courier login.");
}

export function providerLabel(kind: "whatsapp" | "payments" | "delivery", live: boolean) {
  if (kind === "whatsapp") return live ? "meta" : "mock";
  if (kind === "payments") return live ? "razorpay" : "mock";
  return live ? "shiprocket" : "mock";
}
