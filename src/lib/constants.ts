export const SESSION_COOKIE = "me_session";

export const MEMBERSHIP_ROLES = ["OWNER", "ADMIN", "EMPLOYEE"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const EMPLOYEE_TYPES = ["AI", "HUMAN"] as const;
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const EMPLOYEE_STATUSES = ["WORKING", "PAUSED", "HUMAN_ONLY", "OFFLINE", "SETUP_REQUIRED"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const AI_TONES = [
  "friendly",
  "professional",
  "informal",
  "premium",
  "traditional",
] as const;
export type AiTone = (typeof AI_TONES)[number];

export const LANGUAGES = ["hi", "en", "hinglish"] as const;
export type AppLanguage = (typeof LANGUAGES)[number];

export const BUSINESS_CATEGORIES = [
  "electrical_wholesaler",
  "hardware",
  "garments",
  "auto_parts",
  "building_materials",
  "packaging",
  "distributor",
  "other",
  "hardware_electrical",
  "apparel",
  "wholesaler",
  "retailer",
  "manufacturer",
  "trader",
  "food",
  "services",
] as const;

export const ONBOARD_CATEGORIES = [
  "electrical_wholesaler",
  "hardware",
  "garments",
  "auto_parts",
  "building_materials",
  "packaging",
  "distributor",
  "other",
] as const;

export const AI_NAME_SUGGESTIONS = ["Rahul", "Priya", "Amit", "Neha"] as const;

export const DEFAULT_BUSINESS_HOURS = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  openTime: "09:00",
  closeTime: "19:00",
  closed: dayOfWeek === 0,
}));

export const DEFAULT_AI_ROLE = "AI Sales Employee";

export const DEFAULT_RESPONSIBILITIES = {
  handles: [
    "customer_enquiries",
    "product_information",
    "order_management",
    "invoice_assistance",
    "delivery_coordination",
    "customer_follow_up",
  ],
  escalates: [
    "refunds",
    "complaints",
    "unusual_discounts",
    "large_orders",
    "uncertain_product_information",
    "policy_exceptions",
  ],
} as const;

export const HANDLE_LABELS: Record<string, string> = {
  customer_enquiries: "Customer enquiries",
  product_information: "Product information",
  order_management: "Order management",
  invoice_assistance: "Invoice assistance",
  delivery_coordination: "Delivery coordination",
  customer_follow_up: "Customer follow-up",
};

export const ESCALATE_LABELS: Record<string, string> = {
  refunds: "Refunds",
  complaints: "Complaints",
  unusual_discounts: "Unusual discounts",
  large_orders: "Large orders",
  uncertain_product_information: "Uncertain product information",
  policy_exceptions: "Policy exceptions",
};

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  hi: "Hindi — सीधा हिंदी",
  en: "English",
  hinglish: "Hinglish — jaise roz baat karte ho",
};

export const CATEGORY_LABELS: Record<(typeof BUSINESS_CATEGORIES)[number], string> = {
  electrical_wholesaler: "Electrical wholesaler",
  hardware: "Hardware",
  garments: "Garments",
  auto_parts: "Auto parts",
  building_materials: "Building materials",
  packaging: "Packaging",
  distributor: "Distributor",
  other: "Other",
  hardware_electrical: "Hardware / electrical",
  apparel: "Apparel",
  wholesaler: "Wholesaler",
  retailer: "Retailer",
  manufacturer: "Manufacturer",
  trader: "Local trader",
  food: "Food / products",
  services: "Services",
};

export const TONE_LABELS: Record<AiTone, string> = {
  friendly: "Friendly",
  professional: "Professional",
  informal: "Informal",
  premium: "Premium",
  traditional: "Traditional",
};

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DEFAULT_ESCALATION_RULES = {
  refund: true,
  complaint: true,
  discountPercentOver: 10,
  orderAmountPaiseOver: 5000000,
  lowProductConfidence: 0.8,
  angryCustomer: true,
};

export const DEFAULT_APPROVAL_RULES = {
  largeOrderPaise: 5000000,
  discountPercent: 10,
  refunds: true,
};
