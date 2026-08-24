import { AppShell } from "@/components/AppShell";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/tenant";
import { BusinessBrainForm } from "@/components/BusinessBrainForm";
import { ensureDefaultRules } from "@/lib/usp/rules";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function RulesPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  await ensureDefaultRules(ctx.businessId);
  const rules = await prisma.businessRule.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { priority: "asc" },
  });

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title={`Set ${ai.name}'s rules`}
        description={`Business brain is evaluated on the server. ${ai.name} cannot bypass these rules.`}
      />
      <BusinessBrainForm
        employeeName={ai.name}
        rules={rules.map((rule) => ({
          id: rule.id,
          ruleType: rule.ruleType,
          priority: rule.priority,
          condition: parseJson(rule.condition, {}),
          action: rule.action,
          approvalRequired: rule.approvalRequired,
          enabled: rule.enabled,
        }))}
      />
    </AppShell>
  );
}
