import { AppShell } from "@/components/AppShell";
import { ConversationWorkspace } from "@/components/ConversationWorkspace";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const conversation = await prisma.conversation.findFirst({
    where: { id, businessId: ctx.businessId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
      orders: {
        include: { payments: true, deliveries: true, invoices: true, items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!conversation) notFound();

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <ConversationWorkspace employeeName={ai.name} conversation={conversation} />
    </AppShell>
  );
}
