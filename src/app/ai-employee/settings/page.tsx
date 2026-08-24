import { AiEmployeeSettingsForm } from "@/components/AiEmployeeSettingsForm";
import { AppShell } from "@/components/AppShell";
import { FeatureToggles } from "@/components/FeatureToggles";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { listFeaturesForTenant } from "@/lib/platform/plugins";
import { requireBusiness } from "@/lib/session-guard";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function AiEmployeeSettingsPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const features = await listFeaturesForTenant(ctx);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader title={`Give ${ai.name} access`} />
      <AiEmployeeSettingsForm employee={ai} hours={business.hours} />
      <div className="mt-8">
        <FeatureToggles features={features} />
      </div>
    </AppShell>
  );
}
