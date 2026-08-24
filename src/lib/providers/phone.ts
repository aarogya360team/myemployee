/** India mobiles: store last 10 digits, send on WhatsApp as 91XXXXXXXXXX. */
export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function nationalMobile(value: string) {
  const digits = digitsOnly(value);
  if (digits.startsWith("91") && digits.length >= 12) return digits.slice(-10);
  return digits.slice(-10);
}

export function whatsappTo(value: string) {
  const national = nationalMobile(value);
  if (national.length === 10) return `91${national}`;
  const digits = digitsOnly(value);
  return digits || value;
}
