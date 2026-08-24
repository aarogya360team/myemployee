import { getSessionUser } from "@/lib/auth";
import { json } from "@/lib/http";
import { getMembershipForUser } from "@/lib/tenant";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null }, 401);
  const membership = await getMembershipForUser(user.id);
  return json({
    user: { id: user.id, email: user.email, name: user.name },
    membership: membership
      ? {
          role: membership.role,
          businessId: membership.businessId,
          businessName: membership.business.name,
        }
      : null,
  });
}
