import { AppShell } from "@/components/AppShell";
import { ConnectPayments } from "@/components/ConnectPayments";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function PaymentsPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Payments and delivery"
        description={`${ai.name} will not mark paid or delivered until the provider confirms.`}
      />
      <div className="panel p-5">
        <ConnectPayments />
      </div>
    </AppShell>
  );
}
