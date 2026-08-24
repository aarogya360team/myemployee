import type { AppLanguage } from "@/lib/constants";

const DEVANAGARI = /[\u0900-\u097F]/;
const LATIN_WORD = /[a-zA-Z]{2,}/;

/** Everyday shop talk — romanised Hindi that must count as Hindi/Hinglish, not English. */
const HINDI_ROMAN = [
  "haan",
  "haaji",
  "haanji",
  "nahi",
  "nahin",
  "nahee",
  "achha",
  "accha",
  "acha",
  "theek",
  "thik",
  "bhai",
  "bhaiya",
  "ji",
  "kal",
  "parso",
  "parson",
  "shaam",
  "sham",
  "subah",
  "subha",
  "kitna",
  "kitne",
  "kitni",
  "chahiye",
  "chahie",
  "bhej",
  "bhejo",
  "bhejdo",
  "bhejdena",
  "dena",
  "doonga",
  "dunga",
  "maal",
  "mal",
  "rate",
  "daam",
  "kimat",
  "wala",
  "wali",
  "wale",
  "kya",
  "hai",
  "hain",
  "ho",
  "gaya",
  "gayi",
  "gya",
  "bilkul",
  "zaroor",
  "paise",
  "rupaye",
  "bhejoge",
  "miljayega",
  "jayega",
  "karo",
  "doon",
  "theekhai",
  "achaji",
  "sahi",
  "galat",
  "kharab",
  "wapas",
  "dikhao",
  "batao",
  "bataiye",
  "sunao",
  "bolo",
  "nahiji",
  "aapko",
  "aapka",
  "mera",
  "meri",
  "woh",
  "wo",
  "yeh",
  "ye",
  "ka",
  "ke",
  "ki",
  "ko",
  "se",
  "mein",
  "aur",
  "ya",
  "toh",
];

const ENGLISH_ONLY_HINTS = [
  "please send",
  "can you",
  "invoice",
  "delivery",
  "how much",
  "available",
  "thank you",
  "good morning",
  "i need",
  "i want",
  "send me",
  "what is the price",
];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hindiRomanHits(tokens: string[]) {
  let hits = 0;
  for (const token of tokens) {
    if (HINDI_ROMAN.includes(token)) hits += 1;
    if (token.endsWith("ji") && token.length <= 8) hits += 0.5;
  }
  return hits;
}

export function detectLanguage(raw: string): AppLanguage {
  const text = raw.trim();
  if (!text) return "hinglish";

  const hasDeva = DEVANAGARI.test(text);
  const hasLatin = LATIN_WORD.test(text);
  const tokens = tokenize(text);
  const romanHindi = hindiRomanHits(tokens);
  const lower = text.toLowerCase();
  const englishCue = ENGLISH_ONLY_HINTS.some((hint) => lower.includes(hint));

  if (hasDeva && hasLatin) return "hinglish";
  if (hasDeva && !hasLatin) return "hi";
  if (!hasDeva && romanHindi >= 2) return "hinglish";
  if (!hasDeva && romanHindi >= 1 && !englishCue) return "hinglish";
  if (!hasDeva && englishCue && romanHindi === 0) return "en";
  if (!hasDeva && romanHindi === 0 && tokens.length >= 3) return "en";
  return "hinglish";
}

export function rememberLanguage(
  previous: AppLanguage | null,
  incoming: AppLanguage,
): AppLanguage {
  if (!previous) return incoming;
  if (incoming === previous) return incoming;
  if (incoming === "hinglish" || previous === "hinglish") return "hinglish";
  return incoming;
}
