/** WhatsApp channel — business logic depends on this, not on Meta. */

export type ConnectionHealth = "REAL" | "MOCK" | "DEMO" | "NOT_CONNECTED";

export type WhatsAppStatus = {
  health: ConnectionHealth;
  connected: boolean;
  displayPhone: string | null;
  connectReady: boolean;
  merchantMessage: string;
};

export type WhatsAppProvider = {
  getConnectionStatus(businessId: string): Promise<WhatsAppStatus>;
  connectFromEmbeddedSignup(input: {
    businessId: string;
    code: string;
    wabaId: string;
    phoneNumberId?: string;
    displayPhone?: string;
    existingNumber: boolean;
  }): Promise<WhatsAppStatus>;
  sendMessage(businessId: string, to: string, text: string): Promise<{ ok: boolean; id: string }>;
  disconnect(businessId: string): Promise<void>;
};

export type PhoneNumberProvider = {
  searchNumbers(query: { city?: string }): Promise<{ e164: string; displayPhone: string }[]>;
  reserveNumber(e164: string): Promise<{ ok: boolean }>;
  purchaseNumber(e164: string): Promise<{ ok: boolean }>;
  releaseNumber(e164: string): Promise<{ ok: boolean }>;
  assignNumber(input: { businessId: string; e164: string; employeeId?: string }): Promise<{ ok: boolean }>;
  getNumberStatus(e164: string): Promise<"RESERVED" | "ASSIGNED" | "RELEASED" | "UNAVAILABLE">;
};

export const unavailableNumbers: PhoneNumberProvider = {
  async searchNumbers() {
    return [];
  },
  async reserveNumber() {
    return { ok: false };
  },
  async purchaseNumber() {
    return { ok: false };
  },
  async releaseNumber() {
    return { ok: false };
  },
  async assignNumber() {
    return { ok: false };
  },
  async getNumberStatus() {
    return "UNAVAILABLE";
  },
};
