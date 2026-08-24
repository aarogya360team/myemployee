export function matchCustomerIdentity(input: {
  phone?: string | null;
  existingPhones: string[];
}) {
  const phone = input.phone?.replace(/\D/g, "") ?? "";
  if (phone.length >= 10) {
    const hit = input.existingPhones.find((p) => p.replace(/\D/g, "").endsWith(phone.slice(-10)));
    if (hit) return { customerPhone: hit, confidence: 1, askConfirmation: false as const };
  }
  if (phone.length > 0) {
    return { customerPhone: null, confidence: 0.3, askConfirmation: true as const };
  }
  return { customerPhone: null, confidence: 0, askConfirmation: true as const };
}
