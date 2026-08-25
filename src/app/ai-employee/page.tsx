import { ConversationTryout } from "@/components/ConversationTryout";
import { AiEmployeeProfile } from "@/components/AiEmployeeProfile";
import { AppShell } from "@/components/AppShell";
import { getAiEmployee, getAiEmployeeStats, serializeEmployee } from "@/lib/ai-employee";
import { learningStats } from "@/lib/learning";
import { requireBusiness } from "@/lib/session-guard";
import { notFound } from "next/navigation";

export default async function AiEmployeePage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const stats = await getAiEmployeeStats(ctx);
  const ai = serializeEmployee(employee);
  let learning = null;
  try {
    learning = await learningStats(ctx.businessId);
  } catch {
    learning = null;
  }

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <AiEmployeeProfile
        employee={ai}
        stats={stats}
        hours={business.hours}
        businessName={business.name}
        learning={learning}
      />
      <div className="mt-5">
        <ConversationTryout employeeName={ai.name} />
      </div>
    </AppShell>
  );
}
