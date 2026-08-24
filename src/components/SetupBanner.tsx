import Link from "next/link";
import type { ChecklistItem } from "@/lib/onboarding";

export function SetupBanner({
  employeeName,
  live,
  canGoLive,
  nextHref = "/onboard",
}: {
  employeeName: string;
  live: boolean;
  canGoLive: boolean;
  nextHref?: string;
}) {
  if (live) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-3">
      <div>
        <p className="text-sm font-semibold">Continue setup</p>
        <p className="text-sm text-[var(--muted)]">
          {canGoLive
            ? `${employeeName} is ready. Go live when you are.`
            : `Finish hiring ${employeeName} so customers can reach a complete sale.`}
        </p>
      </div>
      <Link href={nextHref} className="btn-primary">
        {canGoLive ? "Go live" : "Continue setup"}
      </Link>
    </div>
  );
}

export function GoLiveChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm">
          <span className={item.done ? "text-emerald-600" : "text-[var(--muted)]"}>{item.done ? "✓" : "○"}</span>
          <span>
            <span className="font-medium">{item.label}</span>
            {!item.required ? <span className="text-[var(--muted)]"> · optional</span> : null}
            {item.hint ? <span className="mt-0.5 block text-xs text-[var(--muted)]">{item.hint}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
