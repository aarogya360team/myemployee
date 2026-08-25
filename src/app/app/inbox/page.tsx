import { AppShell } from "@/components/AppShell";
import { ConversationTryout } from "@/components/ConversationTryout";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { merchantWhatsAppStatus } from "@/lib/integrations";
import { getPlatformEnv } from "@/lib/platform/env";
import { requireBusiness } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InboxPage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const env = getPlatformEnv();
  const [whatsapp, conversations] = await Promise.all([
    merchantWhatsAppStatus(ctx.businessId, Boolean(env.metaAppId && env.metaConfigId)),
    prisma.conversation.findMany({
      where: { businessId: ctx.businessId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        orders: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
  ]);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <PageHeader
        title="Inbox"
        description={
          whatsapp.connected
            ? `${ai.name} is on WhatsApp${whatsapp.displayPhone ? ` · ${whatsapp.displayPhone}` : "."}`
            : `${whatsapp.merchantMessage} Open Test chat to run the full sale without Meta.`
        }
        actions={
          <Link href="/app/try-whatsapp" className="btn-primary text-sm">
            Test chat
          </Link>
        }
      />
      {conversations.length === 0 ? (
        <EmptyState
          title="No customer conversations yet"
          body={`Test ${ai.name} below. Live WhatsApp enquiries appear here after you connect WhatsApp.`}
        />
      ) : (
        <ul className="mb-6 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {conversations.map((row, i) => {
            const demo = row.customer?.segment === "TRYOUT" || row.customer?.phone === "TRYOUT";
            return (
              <li key={row.id} className={i > 0 ? "border-t border-[var(--line)]" : ""}>
                <Link href={`/app/inbox/${row.id}`} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-[var(--paper)]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {row.customer?.name || row.customer?.phone || "Customer"}
                      {demo ? <span className="ml-2 text-xs font-normal text-[var(--warn)]">DEMO</span> : null}
                    </p>
                    <p className="truncate text-sm text-[var(--muted)]">{row.messages[0]?.body || "No messages yet"}</p>
                  </div>
                  <p className="shrink-0 text-xs text-[var(--muted)]">
                    {row.controlMode === "HUMAN" ? "You" : row.nextBestAction ?? row.currentState}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ConversationTryout employeeName={ai.name} showIdentity demo />
    </AppShell>
  );
}
