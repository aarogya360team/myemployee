export const MEMORY_SOURCES = [
  "CONFIRMED_ORDER",
  "CUSTOMER_MESSAGE",
  "OWNER_INPUT",
  "SYSTEM_EVENT",
] as const;

export type MemorySource = (typeof MEMORY_SOURCES)[number];

export type MemoryFact = {
  field: string;
  value: string;
  source: MemorySource;
  sourceId?: string;
};

export type CustomerMemory = {
  name?: string;
  language?: string;
  location?: string;
  customerType?: string;
  productsPurchased: string[];
  frequentlyRequestedProducts: string[];
  averageOrderValuePaise?: number;
  orderFrequency?: string;
  preferredPaymentMethod?: string;
  preferredDeliveryMethod?: string;
  customerSpecificPrice?: string;
  creditTerms?: string;
  lastOrder?: string;
  nextExpectedOrder?: string;
  complaints: string[];
  preferences: string[];
  importantNotes: string[];
  salesStage?: string;
};

export const EMPTY_MEMORY: CustomerMemory = {
  productsPurchased: [],
  frequentlyRequestedProducts: [],
  complaints: [],
  preferences: [],
  importantNotes: [],
};

export function parseMemory(raw: string | null | undefined): CustomerMemory {
  if (!raw) return emptyMemory();
  try {
    const parsed = JSON.parse(raw) as Partial<CustomerMemory>;
    return {
      ...emptyMemory(),
      ...parsed,
      productsPurchased: parsed.productsPurchased ?? [],
      frequentlyRequestedProducts: parsed.frequentlyRequestedProducts ?? [],
      complaints: parsed.complaints ?? [],
      preferences: parsed.preferences ?? [],
      importantNotes: parsed.importantNotes ?? [],
    };
  } catch {
    return emptyMemory();
  }
}

export function emptyMemory(): CustomerMemory {
  return {
    productsPurchased: [],
    frequentlyRequestedProducts: [],
    complaints: [],
    preferences: [],
    importantNotes: [],
  };
}

export function applyFact(memory: CustomerMemory, fact: MemoryFact): CustomerMemory {
  const next: CustomerMemory = {
    ...memory,
    productsPurchased: [...memory.productsPurchased],
    frequentlyRequestedProducts: [...memory.frequentlyRequestedProducts],
    complaints: [...memory.complaints],
    preferences: [...memory.preferences],
    importantNotes: [...memory.importantNotes],
  };
  switch (fact.field) {
    case "name":
      next.name = fact.value;
      break;
    case "language":
      next.language = fact.value;
      break;
    case "location":
      next.location = fact.value;
      break;
    case "product_purchased":
      if (!next.productsPurchased.includes(fact.value)) next.productsPurchased.push(fact.value);
      break;
    case "product_requested":
      if (!next.frequentlyRequestedProducts.includes(fact.value)) {
        next.frequentlyRequestedProducts.push(fact.value);
      }
      break;
    case "last_order":
      next.lastOrder = fact.value;
      break;
    case "preferred_payment":
      next.preferredPaymentMethod = fact.value;
      break;
    case "preferred_delivery":
      next.preferredDeliveryMethod = fact.value;
      break;
    case "complaint":
      next.complaints.push(fact.value);
      break;
    case "note":
      next.importantNotes.push(fact.value);
      break;
    case "sales_stage":
      next.salesStage = fact.value;
      break;
    default:
      break;
  }
  return next;
}

export function rebuildMemory(facts: Array<{ field: string; value: string; source: string }>): CustomerMemory {
  return facts.reduce(
    (memory, fact) =>
      applyFact(memory, {
        field: fact.field,
        value: fact.value,
        source: (MEMORY_SOURCES as readonly string[]).includes(fact.source)
          ? (fact.source as MemorySource)
          : "OWNER_INPUT",
      }),
    emptyMemory(),
  );
}

export function whyDoesEmployeeKnow(fact: { source: MemorySource; field: string }) {
  switch (fact.source) {
    case "CONFIRMED_ORDER":
      return `From a confirmed order — ${fact.field}.`;
    case "CUSTOMER_MESSAGE":
      return `The customer said this — ${fact.field}.`;
    case "OWNER_INPUT":
      return `You added this — ${fact.field}.`;
    case "SYSTEM_EVENT":
      return `A verified system event — ${fact.field}.`;
    default:
      return "Unknown source — do not treat as a fact.";
  }
}
