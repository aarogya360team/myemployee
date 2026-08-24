import { createHmac } from "crypto";
import type { PaymentProvider } from "./types";

export function razorpayPayments(config: { keyId: string; keySecret: string }): PaymentProvider {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  return {
    async createPaymentLink(input) {
      const res = await fetch("https://api.razorpay.com/v1/payment_links", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: input.amountPaise,
          currency: "INR",
          accept_partial: false,
          description: input.description.slice(0, 2048),
          reference_id: input.reference.slice(0, 40),
          callback_method: "get",
          notes: { aurelPaymentRef: input.reference },
          customer: {
            name: input.customerName || "Customer",
            contact: input.customerPhone || undefined,
          },
        }),
      });
      const data = (await res.json()) as {
        id?: string;
        short_url?: string;
        error?: { description?: string };
      };
      if (!res.ok || !data.id || !data.short_url) {
        return { ok: false, id: data.error?.description ?? "razorpay_failed", url: "" };
      }
      return { ok: true, id: data.id, url: data.short_url };
    },
  };
}

export function razorpaySignatureOk(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}
