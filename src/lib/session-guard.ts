import { getSessionState } from "@/lib/auth";
import { loadTenantBusiness, resolveTenantContext } from "@/lib/platform/tenant";
import { getMembershipForUser } from "@/lib/tenant";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await getSessionState();
  if (!session) redirect("/login");
  return session;
}

export async function requireBusiness() {
  const session = await requireUser();
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) redirect("/onboard");
  const ctx = await resolveTenantContext(
    session.user.id,
    null,
    session.activeBusinessId,
  );
  const business = await loadTenantBusiness(ctx);
  return { user: session.user, membership, business, ctx };
}
