import { AppShell } from "@/components/AppShell";
import { WhatsAppTestChat } from "@/components/WhatsAppTestChat";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function TryWhatsAppPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title={`Test ${ai.name} on WhatsApp`}
        description="Full sale on a WhatsApp-looking chat — greeting, quote, order, UPI, delivery. Not sent to a real number."
      />
      <WhatsAppTestChat employeeName={ai.name} businessName={business.name} />
    </AppShell>
  );
}
