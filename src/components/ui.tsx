import { BRAND } from "@/lib/brand";
import Image from "next/image";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {body ? <p className="empty-body">{body}</p> : null}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "danger" | "brand";
  children: React.ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel p-5 ${className}`}>{children}</div>;
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

export function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      {inverted ? (
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/12 text-sm font-semibold text-white">
          A
        </span>
      ) : (
        <Image src={BRAND.markSrc} alt="" width={32} height={32} className="size-8 rounded-lg object-cover" />
      )}
      <span
        className={`text-[15px] font-semibold tracking-[0.16em] ${inverted ? "text-white" : "text-[var(--ink)]"}`}
      >
        {BRAND.wordmark}
      </span>
    </span>
  );
}
