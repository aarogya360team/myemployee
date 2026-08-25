import type { AppLanguage } from "@/lib/constants";
import { detectLanguage, rememberLanguage } from "./detect";
import { detectIntent, type CustomerIntent } from "./intent";
import {
  escalateHandoff,
  identityReply,
  letMeCheck,
  askOne,
} from "./style";
import { toSsml, voiceProfileFor } from "./voice";

export type ConversationTurnInput = {
  text: string;
  channel: "whatsapp" | "web" | "phone";
  employeeName: string;
  businessName: string;
  previousLanguage?: AppLanguage | null;
  personality?: {
    greeting?: "namaste" | "hello" | "radhe";
    addressForm?: "aap" | "tum" | "sir";
    verbosity?: "short" | "normal" | "detailed";
  };
  /** Only facts tools already verified. Never pass guesses. */
  verified?: {
    productName?: string;
    priceLabel?: string;
    stockOk?: boolean;
  };
};

export type ConversationTurn = {
  language: AppLanguage;
  intent: CustomerIntent;
  reply: string;
  voice: {
    locale: "hi-IN" | "en-IN";
    ssml: string;
    accent: "indian";
  };
  needsTool: boolean;
  escalate: boolean;
};

export function handleCustomerTurn(input: ConversationTurnInput): ConversationTurn {
  const language = rememberLanguage(
    input.previousLanguage ?? null,
    detectLanguage(input.text),
  );
  const intent = detectIntent(input.text);
  const built = buildReply(language, intent, input);

  return {
    language,
    intent,
    reply: built.reply,
    needsTool: built.needsTool,
    escalate: built.escalate,
    voice: {
      locale: voiceProfileFor(language).locale,
      accent: "indian",
      ssml: toSsml(built.reply, language),
    },
  };
}

function buildReply(
  language: AppLanguage,
  intent: CustomerIntent,
  input: ConversationTurnInput,
): { reply: string; needsTool: boolean; escalate: boolean } {
  const { employeeName, businessName, verified } = input;

  if (intent === "identity") {
    return {
      reply: identityReply(language, businessName, employeeName),
      needsTool: false,
      escalate: false,
    };
  }

  if (intent === "refund" || intent === "complaint") {
    return { reply: escalateHandoff(language), needsTool: true, escalate: true };
  }

  if (intent === "greeting") {
    return {
      reply: greetingReply(language, employeeName, businessName, input.personality),
      needsTool: false,
      escalate: false,
    };
  }

  if (intent === "price" || intent === "stock") {
    if (verified?.productName && verified.priceLabel) {
      const stockBit =
        verified.stockOk === false
          ? language === "en"
            ? " Stock is short — let me confirm."
            : " Stock thoda short hai, main confirm karta hoon."
          : "";
      const reply =
        language === "en"
          ? `${verified.productName} is ${verified.priceLabel}.${stockBit} How many pieces?`
          : `Ji, ${verified.productName} ${verified.priceLabel} ka hai.${stockBit} Aapko kitne pieces chahiye?`;
      return { reply, needsTool: false, escalate: false };
    }
    return {
      reply:
        language === "en"
          ? "Let me confirm the current price from our list. Which item — brand and watt/size?"
          : "Ji, current price catalogue se confirm karta hoon. Kaunsa item — brand aur watt/size?",
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "quantity") {
    return {
      reply: askOne(
        language,
        "Ji. Delivery kahan chahiye?",
        "Got it. Where should we deliver?",
      ),
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "address") {
    return {
      reply: askOne(
        language,
        "Address note kar liya. Order confirm karun?",
        "Address noted. Shall I confirm the order?",
      ),
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "payment_done") {
    return {
      reply:
        language === "en"
          ? "I will mark it paid only after the payment provider confirms."
          : "Provider confirm kare tabhi paid likhunga.",
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "delivery_when") {
    return {
      reply: askOne(
        language,
        "Ji. Kal delivery chahiye. Address wahi last wala hai kya?",
        "Tomorrow delivery. Same address as last time?",
      ),
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "invoice") {
    return {
      reply:
        language === "en"
          ? "I'll send the bill on WhatsApp after the system confirms it went out."
          : "Bill WhatsApp karunga — pehle system confirm karega ki send ho gaya.",
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "feedback") {
    return {
      reply:
        language === "en"
          ? "Thanks — I've noted that. Next time you need stock, just message."
          : "Shukriya. Note kar liya. Agli baar maal chahiye toh message kar dena.",
      needsTool: false,
      escalate: false,
    };
  }

  if (intent === "confirm_yes") {
    return {
      reply: letMeCheck(language),
      needsTool: true,
      escalate: false,
    };
  }

  if (intent === "confirm_no") {
    return {
      reply:
        language === "en"
          ? "Okay. Tell me what to change."
          : "Theek hai. Bataiye kya change karna hai.",
      needsTool: false,
      escalate: false,
    };
  }

  return {
    reply: letMeCheck(language),
    needsTool: true,
    escalate: false,
  };
}

function greetingReply(
  language: AppLanguage,
  employeeName: string,
  businessName: string,
  personality?: ConversationTurnInput["personality"],
) {
  const greeting = personality?.greeting ?? "namaste";
  const address = personality?.addressForm ?? "aap";
  const open = language === "en" ? "What do you need?" : address === "tum" ? "Bata, kya chahiye?" : "Bataiye, kya chahiye?";
  if (language === "en") {
    const hi = greeting === "hello" ? "Hello" : greeting === "radhe" ? "Radhe Radhe" : "Namaste";
    return `${hi}, ${employeeName} here from ${businessName}. ${open}`;
  }
  const hi =
    greeting === "hello" ? "Hello" : greeting === "radhe" ? "Radhe Radhe" : "Namaste";
  return `${hi}, ${employeeName} bol raha hoon, ${businessName}. ${open}`;
}
