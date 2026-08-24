import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

function key() {
  const secret = process.env.SESSION_SECRET || "dev-session-secret";
  return scryptSync(secret, "aurel-integration-secrets", 32);
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(value: string) {
  if (!value.startsWith("enc:")) return value;
  const [, ivB64, tagB64, dataB64] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export function maskPhone(display: string | null | undefined) {
  const digits = (display ?? "").replace(/\D/g, "");
  if (digits.length < 6) return display || "";
  return `+${digits.slice(0, digits.length - 10) || "91"} ${digits.slice(-10, -7)}•••${digits.slice(-3)}`;
}
