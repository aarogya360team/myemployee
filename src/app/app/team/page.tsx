import { AppShell } from "@/components/AppShell";
import { TeamHire } from "@/components/TeamHire";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { getActiveSubscription, getLimit } from "@/lib/billing/entitlements";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { WORKFORCE_TEMPLATES } from "@/lib/usp/workforce";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function TeamPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const [employees, seatLimit, sub] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId: ctx.businessId, type: "AI" },
      orderBy: { createdAt: "asc" },
    }),
    getLimit(ctx.businessId, "EMPLOYEES"),
    getActiveSubscription(ctx.businessId),
  ]);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Team"
        description="Rahul takes the first live path. Priya, Amit, and Neha are hired only if the plan has seats left."
      />
      <TeamHire
        employees={employees.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          workforceRole: row.workforceRole,
          status: row.status,
        }))}
        templates={WORKFORCE_TEMPLATES}
        seatsUsed={employees.length}
        seatLimit={seatLimit}
        planCode={sub?.plan.code ?? "STARTER"}
      />
    </AppShell>
  );
}
