import { NextRequest } from "next/server";
import { getAiEmployee, getAiEmployeeStats, serializeEmployee } from "@/lib/ai-employee";
import { getSessionState } from "@/lib/auth";
import { updateAiEmployee } from "@/lib/business";
import { handleError, json } from "@/lib/http";
import { listFeaturesForTenant } from "@/lib/platform/plugins";
import { loadTenantBusiness, resolveTenantContext } from "@/lib/platform/tenant";
import { HttpError } from "@/lib/tenant";
import { patchAiEmployeeSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    const business = await loadTenantBusiness(ctx);
    const employee = await getAiEmployee(ctx);
    if (!employee) throw new HttpError(404, "AI employee not found.");
    const stats = await getAiEmployeeStats(ctx);
    const features = await listFeaturesForTenant(ctx);
    return json({
      employee: serializeEmployee(employee),
      stats,
      hours: business.hours,
      businessName: business.name,
      features,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionState();
    if (!session) return json({ error: "Please sign in." }, 401);
    const body = await request.json();
    const parsed = patchAiEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "Invalid AI employee update." }, 400);
    }
    const ctx = await resolveTenantContext(
      session.user.id,
      null,
      session.activeBusinessId,
    );
    const employee = await updateAiEmployee(ctx, parsed.data);
    const business = await loadTenantBusiness(ctx);
    return json({ employee: serializeEmployee(employee), hours: business.hours });
  } catch (error) {
    return handleError(error);
  }
}
