import { AppShell } from "@/components/AppShell";
import { MemoryFactEditor, StaffCustomerForm } from "@/components/CustomerMemory";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { whyDoesEmployeeKnow, parseMemory } from "@/lib/usp/memory";
import { INSUFFICIENT_DATA } from "@/lib/usp/positioning";
import { EmptyState, PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function CustomersPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const customers = await prisma.customer.findMany({
    where: { businessId: ctx.businessId },
    include: { memoryFacts: { orderBy: { createdAt: "desc" }, take: 12 }, timelineEvents: { orderBy: { createdAt: "desc" }, take: 8 } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Customer memory"
        description={`${ai.name} only remembers confirmed orders, customer messages, your notes, or verified system events.`}
      />
      <StaffCustomerForm />
      {customers.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={INSUFFICIENT_DATA} body="Add a customer by mobile number to start a journey." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {customers.map((customer) => {
            const memory = parseMemory(customer.memoryJson);
            return (
              <li key={customer.id} className="panel p-5">
                <p className="font-semibold">{customer.name ?? customer.phone}</p>
                <p className="text-xs text-[var(--muted)]">{customer.phone} · {customer.language}</p>
                {memory.frequentlyRequestedProducts.length > 0 ? (
                  <p className="mt-2 text-sm">Asked for: {memory.frequentlyRequestedProducts.join(", ")}</p>
                ) : null}
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Why does {ai.name} know this?
                </h3>
                <MemoryFactEditor
                  customerId={customer.id}
                  facts={customer.memoryFacts.map((fact) => ({
                    id: fact.id,
                    field: fact.field,
                    value: fact.value,
                    source: fact.source,
                    why: whyDoesEmployeeKnow({
                      source: fact.source as "CONFIRMED_ORDER" | "CUSTOMER_MESSAGE" | "OWNER_INPUT" | "SYSTEM_EVENT",
                      field: fact.field,
                    }),
                  }))}
                />
                {customer.timelineEvents.length > 0 ? (
                  <ol className="mt-3 border-t border-[var(--line)] pt-3 text-sm">
                    {customer.timelineEvents.map((event) => (
                      <li key={event.id} className="flex justify-between gap-2 py-1">
                        <span>{event.title}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {event.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} {event.channel}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
