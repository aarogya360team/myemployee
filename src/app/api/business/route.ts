import { NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth";
import {
  createBusinessForOwner,
  getBusinessForUser,
  updateBusiness,
} from "@/lib/business";
import { handleError, json } from "@/lib/http";
import { listAccessibleBusinesses, resolveTenantContext } from "@/lib/platform/tenant";
import { parseJson } from "@/lib/tenant";
import { createBusinessSchema, patchBusinessSchema } from "@/lib/validators";

function serializeBusiness(
  business: Awaited<ReturnType<typeof getBusinessForUser>>,
) {
  return {
    id: business.id,
    name: business.name,
    legalName: business.legalName,
    category: business.category,
    description: business.description,
    address: business.address,
    city: business.city,
    phone: business.phone,
    email: business.email,
    gstin: business.gstin,
    timezone: business.timezone,
    currency: business.currency,
    defaultLanguage: business.defaultLanguage,
    onboardingStep: business.onboardingStep,
    whatsappPath: business.whatsappPath,
    goLiveAt: business.goLiveAt,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    hours: business.hours,
    employees: business.employees,
    settings: business.settings
      ? {
          ...business.settings,
          languagesEnabled: parseJson<string[]>(
            business.settings.languagesEnabled,
            ["hinglish"],
          ),
          escalationRules: parseJson(business.settings.escalationRules, {}),
          approvalRules: parseJson(business.settings.approvalRules, {}),
        }
      : null,
    features: business.features,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const body = await request.json();
    const parsed = createBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Please complete every onboarding step.", details: parsed.error.flatten() }, 400);
    }
    const created = await createBusinessForOwner(session.user.id, parsed.data);
    const business = await getBusinessForUser(session.user.id, created.id);
    return json({ business: serializeBusiness(business) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const id = request.nextUrl.searchParams.get("id") ?? undefined;
    const business = await getBusinessForUser(
      session.user.id,
      id,
      session.activeBusinessId,
    );
    const shops = await listAccessibleBusinesses(session.user.id);
    return json({ business: serializeBusiness(business), shops });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const body = await request.json();
    const parsed = patchBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Invalid business update." }, 400);
    }
    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    const business = await updateBusiness(ctx, parsed.data);
    return json({ business });
  } catch (error) {
    return handleError(error);
  }
}
