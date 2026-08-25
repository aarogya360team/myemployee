export type CustomerIntent =
  | "greeting"
  | "identity"
  | "price"
  | "stock"
  | "quantity"
  | "confirm_yes"
  | "confirm_no"
  | "delivery_when"
  | "address"
  | "payment_done"
  | "invoice"
  | "complaint"
  | "refund"
  | "feedback"
  | "other";

const YES = [
  "haan",
  "haaji",
  "haan ji",
  "haanji",
  "yes",
  "yeah",
  "yep",
  "ok",
  "okay",
  "okey",
  "theek",
  "theek hai",
  "thik hai",
  "sahi",
  "sahi hai",
  "bilkul",
  "kar do",
  "kar doon",
  "confirm",
  "done",
  "ho gaya",
  "ho gya",
  "ji",
  "ji haan",
];

const NO = [
  "nahi",
  "nahin",
  "nahee",
  "no",
  "nope",
  "mat",
  "cancel",
  "mat karo",
  "rehne do",
];

function has(text: string, needles: string[]) {
  const t = text.toLowerCase();
  return needles.some((n) => t === n || t.includes(n));
}

export function looksLikeAddress(raw: string) {
  const text = raw.trim().toLowerCase();
  if (text.length < 8) return false;
  if (/\b\d{6}\b/.test(text)) return true;
  if (/address|kahan bhej|kahaan bhej|delivery kahan|delivery kahaan|kahan deliver/.test(text)) {
    return true;
  }
  return /(tilak|nagar|gali|sector|delhi|bagh|colony|road|marg|chowk|block|lane|vihar|enclave|karol|noida|gurgaon|gurugram|mumbai|bangalore|bengaluru|hyderabad|pune|jaipur|lucknow|kanpur|indore)/.test(
    text,
  );
}

export function looksLikePaymentDone(raw: string) {
  const text = raw.trim().toLowerCase();
  return /maine pay|i('ve| have) paid|paid ho|payment (ho|kar|done|kar diya)|upi (kar|ho)|paise de diye|amount sent|pay kar diya/.test(
    text,
  );
}

export function detectIntent(raw: string): CustomerIntent {
  const text = raw.trim().toLowerCase();
  if (!text) return "other";

  if (
    /real person|insaan|human|robot|bot|ai ho|artificial|tum kaun|aap kaun|are you (a )?real/.test(
      text,
    )
  ) {
    return "identity";
  }
  if (
    /kharab|defect|galat maal|kam aaya|short|complaint|problem|issue|paise wapas|refund|wapas karo/.test(
      text,
    )
  ) {
    return /refund|wapas|paise/.test(text) ? "refund" : "complaint";
  }
  if (looksLikePaymentDone(text)) return "payment_done";
  if (/bill|invoice|receipt/.test(text)) return "invoice";
  if (/acha laga|santusht|feedback|rating|\bstars\b|service achi|maal theek/.test(text)) {
    return "feedback";
  }
  if (looksLikeAddress(text)) return "address";
  if (/kal|parso|parson|tomorrow|aaj|delivery|bhej dena|mil jayega/.test(text)) {
    return "delivery_when";
  }
  if (/rate|price|daam|kitne ka|kitna|how much/.test(text)) return "price";
  if (/maal hai|stock|available|available hai|hai kya/.test(text)) return "stock";
  if (/\b\d+\b/.test(text) && /piece|pcs|quantity|kitne|bhej|chahiye/.test(text)) {
    return "quantity";
  }
  if (/namaste|hello|\bhi\b|\bhey\b|radhe|ram ram/.test(text)) return "greeting";
  if (has(text, YES) && text.split(/\s+/).length <= 5) return "confirm_yes";
  if (has(text, NO) && text.split(/\s+/).length <= 6) return "confirm_no";
  return "other";
}

export function isAffirmative(raw: string) {
  return detectIntent(raw) === "confirm_yes" || has(raw.toLowerCase(), YES);
}

export function isNegative(raw: string) {
  return detectIntent(raw) === "confirm_no" || has(raw.toLowerCase(), NO);
}
