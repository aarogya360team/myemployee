import { AppShell } from "@/components/AppShell";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { INSUFFICIENT_DATA } from "@/lib/usp/positioning";
import { EscalationQueue } from "@/components/EscalationQueue";
import { EmptyState, PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function EscalationsPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const rows = await prisma.escalation.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const open = rows.filter((r) => r.status === "NEW" || r.status === "OPEN");

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Take over queue"
        description={`${ai.name} knows when to ask for help. This is a feature, not a failure. Open: ${open.length}.`}
      />
      {rows.length === 0 ? (
        <EmptyState title={INSUFFICIENT_DATA} body="Escalations appear here when a customer needs you." />
      ) : (
        <EscalationQueue items={rows} />
      )}
    </AppShell>
  );
}
