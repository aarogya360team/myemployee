export type MessagingProvider = {
  sendMessage(to: string, text: string): Promise<{ ok: boolean; id: string }>;
  sendDocument(to: string, url: string, filename?: string): Promise<{ ok: boolean; id: string }>;
};

export type PaymentProvider = {
  createPaymentLink(input: {
    amountPaise: number;
    reference: string;
    customerPhone?: string;
    customerName?: string;
    description: string;
  }): Promise<{ ok: boolean; url: string; id: string }>;
};

export type ImageProvider = {
  generateImage(prompt: string): Promise<{ ok: boolean; url: string }>;
};

export type DeliveryProvider = {
  getQuote(): Promise<{ ok: boolean; paise: number }>;
  createDelivery(input: {
    orderId: string;
    customerName?: string;
    customerPhone: string;
    address: string;
    items: { name: string; qty: number; pricePaise: number }[];
  }): Promise<{ ok: boolean; trackingId: string }>;
};
