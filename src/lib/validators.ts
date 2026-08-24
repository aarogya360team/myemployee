import { z } from "zod";
import { AI_TONES, BUSINESS_CATEGORIES, LANGUAGES, MEMBERSHIP_ROLES } from "./constants";
import { ADDRESS_FORMS, ATTIRE, GREETINGS, PAUSE_FOR, VERBOSITY } from "./employee-identity";
import { WHATSAPP_PATHS } from "./onboarding";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const languageSchema = z.enum(LANGUAGES);

export const businessHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean(),
});

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).optional().or(z.literal("")),
  category: z.enum(BUSINESS_CATEGORIES),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  gstin: z.string().trim().max(15).optional().or(z.literal("")),
  timezone: z.string().default("Asia/Kolkata"),
  defaultLanguage: languageSchema.default("hinglish"),
  languages: z.array(languageSchema).min(1),
  hours: z.array(businessHoursSchema).length(7).optional(),
  aiEmployeeName: z.string().trim().min(2).max(40),
  aiTone: z.enum(AI_TONES).default("friendly"),
  avatar: z.string().trim().max(80).optional(),
  personality: z
    .object({
      attire: z.enum(ATTIRE).optional(),
      addressForm: z.enum(ADDRESS_FORMS).optional(),
      greeting: z.enum(GREETINGS).optional(),
      verbosity: z.enum(VERBOSITY).optional(),
      appearanceId: z.string().trim().max(40).optional(),
    })
    .optional(),
});

export const patchBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  legalName: z.string().trim().max(160).nullable().optional(),
  category: z.enum(BUSINESS_CATEGORIES).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().min(2).max(80).nullable().optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(120).nullable().optional(),
  gstin: z.string().trim().max(15).nullable().optional(),
  timezone: z.string().optional(),
  defaultLanguage: languageSchema.optional(),
});

export const patchSettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  defaultLanguage: languageSchema.optional(),
  languagesEnabled: z.array(languageSchema).min(1).optional(),
  aiTone: z.enum(AI_TONES).optional(),
  escalationRules: z.record(z.string(), z.unknown()).optional(),
  approvalRules: z.record(z.string(), z.unknown()).optional(),
  hours: z.array(businessHoursSchema).length(7).optional(),
});

export const personalitySchema = z.object({
  tone: z.enum(AI_TONES).optional(),
  attire: z.enum(ATTIRE).optional(),
  addressForm: z.enum(ADDRESS_FORMS).optional(),
  greeting: z.enum(GREETINGS).optional(),
  verbosity: z.enum(VERBOSITY).optional(),
  appearanceId: z.string().trim().max(40).optional(),
});

export const patchAiEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  avatar: z.string().trim().max(80).nullable().optional(),
  role: z.string().trim().min(2).max(80).optional(),
  status: z.enum(["WORKING", "PAUSED", "HUMAN_ONLY", "OFFLINE", "SETUP_REQUIRED"]).optional(),
  languages: z.array(languageSchema).min(1).optional(),
  tone: z.enum(AI_TONES).optional(),
  personality: personalitySchema.optional(),
  pauseFor: z.enum(PAUSE_FOR).optional(),
  workingHours: z.array(businessHoursSchema).length(7).optional(),
  responsibilities: z
    .object({
      handles: z.array(z.string()).optional(),
      escalates: z.array(z.string()).optional(),
    })
    .optional(),
});

export const onboardingPatchSchema = z.object({
  step: z.number().int().min(1).max(9).optional(),
  json: z
    .object({
      whatsappPath: z.enum(WHATSAPP_PATHS).optional(),
      catalogueSkipped: z.boolean().optional(),
      testCompleted: z.boolean().optional(),
      rulesReviewed: z.boolean().optional(),
      escalationReviewed: z.boolean().optional(),
      languageReviewed: z.boolean().optional(),
    })
    .optional(),
  whatsappPath: z.enum(WHATSAPP_PATHS).optional(),
});

export const membershipRoleSchema = z.enum(MEMBERSHIP_ROLES);
