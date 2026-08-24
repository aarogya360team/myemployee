import { AppShell } from "@/components/AppShell";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { formatInr } from "@/lib/billing/catalog";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { INSUFFICIENT_DATA } from "@/lib/usp/positioning";
import { syncRecoveryOpportunities } from "@/lib/usp/money";
import { FollowUpActions, DismissOpportunity } from "@/components/RecoveryActions";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function OpportunitiesPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  await syncRecoveryOpportunities(ctx);
  const rows = await prisma.recoveryOpportunity.findMany({
    where: { businessId: ctx.businessId, status: "OPEN" },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  const estimated = rows.reduce((s, r) => s + (r.estimatedOrderValuePaise ?? 0), 0);
  const estimatedCount = rows.filter((r) => r.estimatedOrderValuePaise != null).length;

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Revenue opportunities"
        description={`${rows.length} customer${rows.length === 1 ? "" : "s"} with incomplete journeys. Estimate is only from catalogue price × quantity already in a quote or draft.`}
      />
      <StatCard
        label="Estimated opportunity"
        value={estimatedCount === 0 ? INSUFFICIENT_DATA : formatInr(estimated)}
      />
      <FollowUpActions />
      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={INSUFFICIENT_DATA} body="Incomplete journeys will appear here once customers stall." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id} className="panel px-4 py-4 text-sm">
              <p className="font-semibold">{row.customer?.name ?? row.customer?.phone ?? "Customer"}</p>
              <p className="mt-1 text-[var(--muted)]">{row.opportunityType.replaceAll("_", " ")}</p>
              <p className="mt-2 font-medium">
                {row.estimatedOrderValuePaise != null
                  ? formatInr(row.estimatedOrderValuePaise)
                  : "No rupee estimate yet"}
              </p>
              <DismissOpportunity id={row.id} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
