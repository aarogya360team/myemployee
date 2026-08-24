import type { DeliveryProvider } from "./types";

type TokenCache = { token: string; exp: number };
const tokens = new Map<string, TokenCache>();

async function login(email: string, password: string) {
  const cached = tokens.get(email);
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    throw new Error(typeof data.message === "string" ? data.message : "Shiprocket login failed.");
  }
  tokens.set(email, { token: data.token, exp: Date.now() + 8 * 24 * 60 * 60 * 1000 });
  return data.token;
}

export function shiprocketDelivery(config: { email: string; password: string }): DeliveryProvider {
  return {
    async getQuote() {
      return { ok: true, paise: 12000 };
    },
    async createDelivery(input) {
      const token = await login(config.email, config.password);
      const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: input.orderId.slice(0, 40),
          order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          pickup_location: "Primary",
          billing_customer_name: input.customerName || "Customer",
          billing_last_name: ".",
          billing_address: input.address.slice(0, 200),
          billing_city: "Delhi",
          billing_pincode: "110001",
          billing_state: "Delhi",
          billing_country: "India",
          billing_email: "orders@aurel.local",
          billing_phone: input.customerPhone.replace(/\D/g, "").slice(-10),
          shipping_is_billing: true,
          order_items: input.items.map((item) => ({
            name: item.name.slice(0, 200),
            sku: item.name.slice(0, 40),
            units: item.qty,
            selling_price: Math.max(1, Math.round(item.pricePaise / 100)),
          })),
          payment_method: "Prepaid",
          sub_total: input.items.reduce((sum, item) => sum + item.pricePaise * item.qty, 0) / 100,
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5,
        }),
      });
      const data = (await res.json()) as {
        shipment_id?: number;
        awb_code?: string;
        message?: string;
      };
      if (!res.ok) {
        return { ok: false, trackingId: data.message ?? "shiprocket_failed" };
      }
      const tracking = data.awb_code || (data.shipment_id ? `SR-${data.shipment_id}` : "");
      if (!tracking) return { ok: false, trackingId: "shiprocket_no_awb" };
      return { ok: true, trackingId: tracking };
    },
  };
}
