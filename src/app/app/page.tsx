import { AppShell } from "@/components/AppShell";
import { getAiEmployee, serializeEmployee } from "@/lib/ai-employee";
import { formatInr } from "@/lib/billing/catalog";
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { requireBusiness } from "@/lib/session-guard";
import { loadDailySummary, loadMoneyScreen, loadScorecard, syncRecoveryOpportunities } from "@/lib/usp/money";
import { INSUFFICIENT_DATA, PRODUCT_POSITIONING, USP_SECONDARY } from "@/lib/usp/positioning";
import { PageHeader, Panel, StatCard } from "@/components/ui";
import { SetupBanner } from "@/components/SetupBanner";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MoneyHomePage() {
  const { user, business, ctx } = await requireBusiness();
  const employee = await getAiEmployee(ctx);
  if (!employee) notFound();
  const ai = serializeEmployee(employee);
  const snapshot = await getOnboardingSnapshot(ctx);
  await syncRecoveryOpportunities(ctx);
  const [screen, day, score] = await Promise.all([
    loadMoneyScreen(ctx),
    loadDailySummary(ctx, ai.name),
    loadScorecard(ctx),
  ]);

  return (
    <AppShell businessName={business.name} employeeName={ai.name} userName={user.name}>
      <SetupBanner employeeName={ai.name} live={snapshot.live} canGoLive={snapshot.canGoLive} />
      <PageHeader title="Today's business" description={USP_SECONDARY} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={screen.cards.aiAssistedRevenue.label} value={screen.cards.aiAssistedRevenue.display} />
        <StatCard label={screen.cards.aiRecoveredRevenue.label} value={screen.cards.aiRecoveredRevenue.display} />
        <StatCard label={screen.cards.orders.label} value={String(screen.cards.orders.value)} />
        <StatCard label={screen.cards.conversion.label} value={screen.cards.conversion.display} />
        <div className="stat-card col-span-2 lg:col-span-4">
          <p className="stat-value">{screen.cards.moneyAtRisk.display}</p>
          <p className="stat-label">{screen.cards.moneyAtRisk.label}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{screen.cards.moneyAtRisk.note}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">Today&apos;s opportunities</h2>
        <ul className="flex flex-col gap-2">
          {screen.today.map((item) => (
            <li key={item.id} className="panel flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm">{item.text}</p>
              <Link href={item.href} className="shrink-0 text-sm font-semibold text-[var(--brand)]">
                {item.action}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">{ai.name}&apos;s day</h2>
          {day.enough ? (
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <li>Enquiries handled: {day.enquiriesHandled}</li>
              <li>Orders created: {day.ordersCreated}</li>
              <li>Revenue assisted: {formatInr(day.revenueAssistedPaise)}</li>
              <li>Revenue recovered: {formatInr(day.revenueRecoveredPaise)}</li>
              <li>Payments collected: {formatInr(day.paymentsCollectedPaise)}</li>
              <li>Follow-ups: {day.customersFollowedUp}</li>
              <li>Escalations: {day.escalations}</li>
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">{day.message ?? INSUFFICIENT_DATA}</p>
          )}
          {day.highlights.length > 0 ? (
            <ul className="mt-4 border-t border-[var(--line)] pt-3 text-sm">
              {day.highlights.map((h) => (
                <li key={`${h.title}-${h.at.toISOString()}`} className="py-1.5">
                  <span className="font-medium">{h.title}</span>
                  {h.detail ? <span className="text-[var(--muted)]"> — {h.detail}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        <Panel>
          <h2 className="font-semibold">{ai.name} score</h2>
          {score.enoughData && score.score != null ? (
            <div>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{score.score}/100</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <li>Conversion: {score.components.enquiryConversion ?? INSUFFICIENT_DATA}</li>
                <li>Order completion: {score.components.orderCompletion ?? INSUFFICIENT_DATA}</li>
                <li>Payment: {score.components.paymentCompletion ?? INSUFFICIENT_DATA}</li>
                <li>Delivery: {score.components.deliveryCompletion ?? INSUFFICIENT_DATA}</li>
                <li>Escalation: {score.components.escalationQuality ?? INSUFFICIENT_DATA}</li>
              </ul>
              <p className="mt-4 text-sm">Revenue assisted: {formatInr(score.revenueAssistedPaise)}</p>
              <p className="text-sm">Revenue recovered: {formatInr(score.revenueRecoveredPaise)}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">{score.message ?? INSUFFICIENT_DATA}</p>
          )}
        </Panel>
      </div>

      <p className="mt-8 text-xs text-[var(--muted)]">{PRODUCT_POSITIONING.firstLivePath}</p>
    </AppShell>
  );
}
