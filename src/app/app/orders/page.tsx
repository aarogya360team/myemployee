import { AppShell } from "@/components/AppShell";
import { OrderDesk } from "@/components/OrderDesk";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { formatInr } from "@/lib/billing/catalog";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function OrdersPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const orders = await prisma.order.findMany({
    where: { businessId: ctx.businessId },
    include: { payments: true, deliveries: true, invoices: true, customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Orders"
        description={`${ai.name} will not mark paid or delivered until the provider confirms. MOCK buttons are for this sandbox only.`}
      />
      <OrderDesk
        orders={orders.map((order) => ({
          id: order.id,
          status: order.status,
          totalLabel: formatInr(order.totalPaise),
          customerLabel: order.customer?.name ?? order.customer?.phone ?? "Customer",
          items: order.items.map((item) => `${item.qty} × ${item.name}`).join(", ") || "No items",
          payments: order.payments.map((p) => ({ id: p.id, status: p.status, link: p.link })),
          deliveries: order.deliveries.map((d) => ({
            id: d.id,
            status: d.status,
            trackingId: d.trackingId,
          })),
          invoices: order.invoices.map((inv) => ({ id: inv.id, number: inv.number, sent: inv.sent })),
        }))}
      />
    </AppShell>
  );
}
