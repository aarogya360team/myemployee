import { AppShell } from "@/components/AppShell";
import { ConnectWhatsApp } from "@/components/ConnectWhatsApp";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { requireBusiness } from "@/lib/session-guard";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function WhatsAppPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const snapshot = await getOnboardingSnapshot(ctx);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="WhatsApp"
        description={`${ai.name} uses the number customers already know. You never paste technical IDs.`}
      />
      <div className="panel p-5">
        <ConnectWhatsApp path={(snapshot.business.whatsappPath as "EXISTING" | "NEW" | "UNSURE" | null) ?? null} />
      </div>
    </AppShell>
  );
}
