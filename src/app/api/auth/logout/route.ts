import { destroySession, getSessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { json } from "@/lib/http";

export async function POST() {
  const user = await getSessionUser();
  await destroySession();
  if (user) {
    await writeAudit({
      userId: user.id,
      actorType: "USER",
      action: "user.logged_out",
      entityType: "User",
      entityId: user.id,
    });
  }
  return json({ ok: true });
}
