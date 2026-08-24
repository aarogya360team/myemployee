"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Metrics =
  | { enough: false; message: string; before: null; after: null }
  | { enough: true; message: null; before: null; after: { orders: number; revenuePaise: number }; note: string };

export function ProofPanel({
  metrics,
  revenueLabel,
  approvals,
}: {
  metrics: Metrics;
  revenueLabel: string | null;
  approvals: { id: string; status: string; published: boolean; createdAt: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function publish(approve: boolean) {
    setPending(true);
    setError("");
    const res = await fetch("/api/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save approval.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {metrics.enough ? (
        <div className="panel p-4 text-sm">
          <p>Orders in this shop: {metrics.after.orders}</p>
          <p>Revenue recorded: {revenueLabel}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{metrics.note}</p>
        </div>
      ) : (
        <p className="panel px-4 py-3 text-sm text-[var(--muted)]">{metrics.message}</p>
      )}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary px-4 py-2 text-sm" type="button" disabled={pending} onClick={() => void publish(true)}>
          I approve publishing these numbers
        </button>
        <button
          className="btn-secondary px-4 py-2 text-sm"
          type="button"
          disabled={pending}
          onClick={() => void publish(false)}
        >
          Save as draft
        </button>
      </div>
      {approvals.length > 0 ? (
        <ul className="panel p-4 text-sm">
          {approvals.map((row) => (
            <li key={row.id} className="border-b border-[var(--line)] py-2 last:border-0">
              {row.status} · {row.published ? "published" : "not public"} · {row.createdAt}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
