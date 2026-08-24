export const ATTIRE = ["formal", "casual", "shop_floor"] as const;
export type Attire = (typeof ATTIRE)[number];

export const ADDRESS_FORMS = ["aap", "tum", "sir"] as const;
export type AddressForm = (typeof ADDRESS_FORMS)[number];

export const GREETINGS = ["namaste", "hello", "radhe"] as const;
export type Greeting = (typeof GREETINGS)[number];

export const VERBOSITY = ["short", "normal", "detailed"] as const;
export type Verbosity = (typeof VERBOSITY)[number];

export const PAUSE_FOR = ["15m", "1h", "today", "indefinite", "resume"] as const;
export type PauseFor = (typeof PAUSE_FOR)[number];

export type EmployeePersonality = {
  tone: string;
  attire: Attire;
  addressForm: AddressForm;
  greeting: Greeting;
  verbosity: Verbosity;
  appearanceId: string;
};

export type EmployeeAppearance = {
  id: string;
  src: string;
  suggestedName: string;
  look: string;
};

export const EMPLOYEE_APPEARANCES: EmployeeAppearance[] = [
  {
    id: "rahul-formal",
    src: "/avatars/rahul-formal.png",
    suggestedName: "Rahul",
    look: "Formal",
  },
  {
    id: "rahul-casual",
    src: "/avatars/rahul-casual.png",
    suggestedName: "Rahul",
    look: "Casual",
  },
  {
    id: "priya-formal",
    src: "/avatars/priya-formal.png",
    suggestedName: "Priya",
    look: "Formal",
  },
  {
    id: "amit-shop",
    src: "/avatars/amit-shop.png",
    suggestedName: "Amit",
    look: "Shop floor",
  },
];

export const DEFAULT_PERSONALITY: EmployeePersonality = {
  tone: "friendly",
  attire: "formal",
  addressForm: "aap",
  greeting: "namaste",
  verbosity: "short",
  appearanceId: "rahul-formal",
};

export const ATTIRE_LABELS: Record<Attire, string> = {
  formal: "Formal",
  casual: "Casual",
  shop_floor: "Shop floor",
};

export const ADDRESS_FORM_LABELS: Record<AddressForm, string> = {
  aap: "Aap — respectful",
  tum: "Tum — familiar",
  sir: "Sir / Madam",
};

export const GREETING_LABELS: Record<Greeting, string> = {
  namaste: "Namaste",
  hello: "Hello",
  radhe: "Radhe Radhe",
};

export const VERBOSITY_LABELS: Record<Verbosity, string> = {
  short: "Short replies",
  normal: "Normal",
  detailed: "A bit more detail",
};

export const PAUSE_LABELS: Record<PauseFor, string> = {
  "15m": "15 minutes",
  "1h": "1 hour",
  today: "Until tonight",
  indefinite: "Until I resume",
  resume: "Back to work",
};

export function appearanceById(id: string | null | undefined) {
  return EMPLOYEE_APPEARANCES.find((item) => item.id === id) ?? EMPLOYEE_APPEARANCES[0];
}

export function appearanceSrc(avatar: string | null | undefined) {
  if (avatar?.startsWith("/")) return avatar;
  return appearanceById(avatar).src;
}

export function parsePersonality(raw: unknown, fallbackTone = "friendly"): EmployeePersonality {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const attire = ATTIRE.includes(value.attire as Attire) ? (value.attire as Attire) : DEFAULT_PERSONALITY.attire;
  const addressForm = ADDRESS_FORMS.includes(value.addressForm as AddressForm)
    ? (value.addressForm as AddressForm)
    : DEFAULT_PERSONALITY.addressForm;
  const greeting = GREETINGS.includes(value.greeting as Greeting)
    ? (value.greeting as Greeting)
    : DEFAULT_PERSONALITY.greeting;
  const verbosity = VERBOSITY.includes(value.verbosity as Verbosity)
    ? (value.verbosity as Verbosity)
    : DEFAULT_PERSONALITY.verbosity;
  const appearanceId =
    typeof value.appearanceId === "string" && value.appearanceId
      ? value.appearanceId
      : DEFAULT_PERSONALITY.appearanceId;
  return {
    tone: typeof value.tone === "string" && value.tone ? value.tone : fallbackTone,
    attire,
    addressForm,
    greeting,
    verbosity,
    appearanceId,
  };
}

export function pauseUntilFrom(pauseFor: PauseFor): { status: "WORKING" | "PAUSED"; pauseUntil: Date | null } {
  if (pauseFor === "resume") return { status: "WORKING", pauseUntil: null };
  if (pauseFor === "indefinite") return { status: "PAUSED", pauseUntil: null };
  const until = new Date();
  if (pauseFor === "15m") until.setMinutes(until.getMinutes() + 15);
  else if (pauseFor === "1h") until.setHours(until.getHours() + 1);
  else {
    until.setHours(23, 59, 59, 999);
  }
  return { status: "PAUSED", pauseUntil: until };
}
