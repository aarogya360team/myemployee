export type OrderDraft = {
  productSku?: string;
  quantity?: number;
  customerPhone?: string;
  address?: string;
  deliveryMethod?: string;
};

export function orderCompleteness(draft: OrderDraft) {
  const missing: string[] = [];
  if (!draft.productSku) missing.push("product");
  if (!draft.quantity) missing.push("quantity");
  if (!draft.customerPhone) missing.push("phone");
  if (!draft.address) missing.push("delivery_address");
  if (!draft.deliveryMethod) missing.push("delivery_method");
  return { complete: missing.length === 0, missing, score: (5 - missing.length) / 5 };
}
