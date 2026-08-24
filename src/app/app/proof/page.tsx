import { AppShell } from "@/components/AppShell";
import { ProofPanel } from "@/components/ProofPanel";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { formatInr } from "@/lib/billing/catalog";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { computeCaseStudyMetrics } from "@/lib/usp/proof";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function ProofPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const [metrics, approvals] = await Promise.all([
    computeCaseStudyMetrics(ctx),
    prisma.caseStudyApproval.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Proof"
        description="Publish only with your approval. Before/after is not invented — set a baseline yourself if you need a comparison."
      />
      <ProofPanel
        metrics={metrics}
        revenueLabel={metrics.enough ? formatInr(metrics.after.revenuePaise) : null}
        approvals={approvals.map((row) => ({
          id: row.id,
          status: row.status,
          published: row.published,
          createdAt: row.createdAt.toLocaleString("en-IN"),
        }))}
      />
    </AppShell>
  );
}
