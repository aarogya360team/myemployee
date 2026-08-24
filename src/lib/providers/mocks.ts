import type { DeliveryProvider, ImageProvider, MessagingProvider, PaymentProvider } from "./types";

export const mockWhatsApp: MessagingProvider = {
  async sendMessage(_to, _text) {
    return { ok: true, id: `wa_${crypto.randomUUID()}` };
  },
  async sendDocument(_to, _url) {
    return { ok: true, id: `wa_doc_${crypto.randomUUID()}` };
  },
};

export const mockPayments: PaymentProvider = {
  async createPaymentLink(input) {
    const id = `pay_${crypto.randomUUID()}`;
    return { ok: true, id, url: `https://pay.mock/in/${id}?amount=${input.amountPaise}` };
  },
};

export const mockDelivery: DeliveryProvider = {
  async getQuote() {
    return { ok: true, paise: 12000 };
  },
  async createDelivery() {
    return { ok: true, trackingId: `MOCK-${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
  },
};

export const mockImages: ImageProvider = {
  async generateImage() {
    return { ok: true, url: "/marketing/hero-electrical-counter.png" };
  },
};

export type { ImageProvider };
