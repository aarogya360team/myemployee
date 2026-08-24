import type { AppLanguage } from "@/lib/constants";

/**
 * Voice must sound like an Indian employee, not a US/UK call-centre bot.
 * Hinglish uses an Indian Hindi voice that already mixes English product words.
 */
export type VoiceProfile = {
  locale: "hi-IN" | "en-IN";
  accent: "indian";
  speakingRate: number;
  pitch: number;
  maxSeconds: number;
  bargeIn: boolean;
  ssmlLang: "hi-IN" | "en-IN";
};

export function voiceProfileFor(language: AppLanguage): VoiceProfile {
  if (language === "en") {
    return {
      locale: "en-IN",
      accent: "indian",
      speakingRate: 1.02,
      pitch: 0,
      maxSeconds: 8,
      bargeIn: true,
      ssmlLang: "en-IN",
    };
  }
  return {
    locale: "hi-IN",
    accent: "indian",
    speakingRate: 1.05,
    pitch: 0,
    maxSeconds: 8,
    bargeIn: true,
    ssmlLang: "hi-IN",
  };
}

export function toSsml(text: string, language: AppLanguage) {
  const profile = voiceProfileFor(language);
  const safe = text.replace(/&/g, "and").replace(/</g, "");
  return `<speak xml:lang="${profile.ssmlLang}"><prosody rate="${profile.speakingRate}">${safe}</prosody></speak>`;
}

export const VOICE_BEHAVIOUR = {
  handleSilence: "Ji, main hoon. Aap boliye — kya chahiye?",
  handleMisheard: "Sorry, ek baar aur boliye? Thoda clearly.",
  oneQuestion: true,
  noLongExplanations: true,
  indianEnglishNotAmerican: true,
};
