export const VERTICALS = [
  "ELECTRICAL_WHOLESALER",
  "HARDWARE",
  "GARMENTS",
  "AUTO_PARTS",
  "BUILDING_MATERIALS",
  "PACKAGING",
  "DISTRIBUTOR",
] as const;

export type VerticalCode = (typeof VERTICALS)[number];

export type VerticalProfile = {
  code: VerticalCode;
  label: string;
  units: string[];
  terminology: string[];
  commonQuestions: string[];
  orderPatterns: string[];
  pricingBehaviour: string[];
  deliveryRequirements: string[];
  escalationScenarios: string[];
  repeatOrderPatterns: string[];
};

export const VERTICAL_PROFILES: Record<VerticalCode, VerticalProfile> = {
  ELECTRICAL_WHOLESALER: {
    code: "ELECTRICAL_WHOLESALER",
    label: "Electrical wholesaler",
    units: ["pcs", "box", "carton", "watt"],
    terminology: ["brand", "model", "B22", "MRP", "dealer price"],
    commonQuestions: ["rate kya hai", "maal hai kya", "box packing", "warranty"],
    orderPatterns: ["repeat SKU + quantity", "mixed-brand carton"],
    pricingBehaviour: ["dealer vs retail", "quantity slabs — only if owner configured"],
    deliveryRequirements: ["godown pickup or local tempo", "same-city next day if owner allows"],
    escalationScenarios: ["special dealer rate", "stock short on large qty", "credit days"],
    repeatOrderPatterns: ["fast-moving lamps and wires on a weekly cycle"],
  },
  HARDWARE: {
    code: "HARDWARE",
    label: "Hardware",
    units: ["pcs", "kg", "box", "set"],
    terminology: ["size", "grade", "finish", "wholesale rate"],
    commonQuestions: ["size available", "rate per kg", "box quantity"],
    orderPatterns: ["mixed fasteners by size"],
    pricingBehaviour: ["trade rate vs walk-in"],
    deliveryRequirements: ["heavy goods, sometimes hired tempo"],
    escalationScenarios: ["credit", "custom cut"],
    repeatOrderPatterns: ["contractor restock"],
  },
  GARMENTS: {
    code: "GARMENTS",
    label: "Garments",
    units: ["piece", "dozen", "set"],
    terminology: ["size", "color", "style", "MOQ", "wholesale rate"],
    commonQuestions: ["MOQ kya hai", "size ratio", "colour available"],
    orderPatterns: ["size-color matrix"],
    pricingBehaviour: ["MOQ before dealer rate"],
    deliveryRequirements: ["carton, courier or transport"],
    escalationScenarios: ["returns", "MOQ exception"],
    repeatOrderPatterns: ["seasonal restock"],
  },
  AUTO_PARTS: {
    code: "AUTO_PARTS",
    label: "Auto parts",
    units: ["pcs", "set"],
    terminology: ["OEM", "vehicle model", "year"],
    commonQuestions: ["kaunsi gaadi", "genuine vs pattern"],
    orderPatterns: ["vehicle-specific SKU"],
    pricingBehaviour: ["MRP vs mechanic rate"],
    deliveryRequirements: ["counter pickup common"],
    escalationScenarios: ["wrong part fitment risk"],
    repeatOrderPatterns: ["workshop monthly"],
  },
  BUILDING_MATERIALS: {
    code: "BUILDING_MATERIALS",
    label: "Building materials",
    units: ["bag", "ton", "sqft", "pcs"],
    terminology: ["grade", "brand", "site delivery"],
    commonQuestions: ["site pe unload", "rate per bag"],
    orderPatterns: ["site quantity"],
    pricingBehaviour: ["transport included or extra"],
    deliveryRequirements: ["site access, labour"],
    escalationScenarios: ["credit to contractor"],
    repeatOrderPatterns: ["project phase restock"],
  },
  PACKAGING: {
    code: "PACKAGING",
    label: "Packaging",
    units: ["pcs", "kg", "roll", "bundle"],
    terminology: ["micron", "size", "print"],
    commonQuestions: ["MOQ", "print plate"],
    orderPatterns: ["repeat size"],
    pricingBehaviour: ["MOQ slabs if configured"],
    deliveryRequirements: ["carton"],
    escalationScenarios: ["custom print"],
    repeatOrderPatterns: ["weekly consumable"],
  },
  DISTRIBUTOR: {
    code: "DISTRIBUTOR",
    label: "Distributor",
    units: ["pcs", "box", "carton"],
    terminology: ["scheme", "dealer", "beat"],
    commonQuestions: ["scheme chal raha hai", "credit limit"],
    orderPatterns: ["beat-wise dealer order"],
    pricingBehaviour: ["scheme + dealer price"],
    deliveryRequirements: ["route delivery"],
    escalationScenarios: ["credit limit breach"],
    repeatOrderPatterns: ["weekly beat"],
  },
};

export function verticalFromCategory(category: string): VerticalCode {
  switch (category) {
    case "electrical_wholesaler":
    case "hardware_electrical":
      return "ELECTRICAL_WHOLESALER";
    case "hardware":
      return "HARDWARE";
    case "garments":
    case "apparel":
      return "GARMENTS";
    case "auto_parts":
      return "AUTO_PARTS";
    case "building_materials":
      return "BUILDING_MATERIALS";
    case "packaging":
      return "PACKAGING";
    case "wholesaler":
    case "distributor":
      return "DISTRIBUTOR";
    default:
      return "ELECTRICAL_WHOLESALER";
  }
}

export function getVerticalProfile(code: string | null | undefined): VerticalProfile {
  if (code && code in VERTICAL_PROFILES) {
    return VERTICAL_PROFILES[code as VerticalCode];
  }
  return VERTICAL_PROFILES.ELECTRICAL_WHOLESALER;
}
