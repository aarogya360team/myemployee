import { OnboardingWizard } from "@/components/OnboardingWizard";
import { BrandMark } from "@/components/ui";
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { requireUser } from "@/lib/session-guard";
import { getMembershipForUser } from "@/lib/tenant";
import { resolveTenantContext } from "@/lib/platform/tenant";
import { redirect } from "next/navigation";

export default async function OnboardPage() {
  const session = await requireUser();
  const membership = await getMembershipForUser(session.user.id);
  if (membership) {
    const ctx = await resolveTenantContext(session.user.id, null, session.activeBusinessId);
    const snapshot = await getOnboardingSnapshot(ctx);
    if (snapshot.live) redirect("/app");
    return (
      <div className="min-h-full bg-[var(--paper)]">
        <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
          <BrandMark />
          <div className="panel mt-8 p-6 sm:p-8">
            <OnboardingWizard
              initial={{
                created: true,
                step: snapshot.step,
                json: snapshot.json,
                business: snapshot.business,
                employee: snapshot.employee,
                hours: snapshot.hours,
                checklist: snapshot.checklist,
                canGoLive: snapshot.canGoLive,
                productCount: snapshot.productCount,
                whatsappPath: snapshot.business.whatsappPath,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-full bg-[var(--paper)]">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
        <BrandMark />
        <div className="panel mt-8 p-6 sm:p-8">
          <OnboardingWizard />
        </div>
      </div>
    </div>
  );
}
