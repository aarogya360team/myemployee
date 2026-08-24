"use client";

import { useRouter } from "next/navigation";

type Item = {
  id: string;
  priority: string;
  reason: string;
  summary: string;
  recommendation: string | null;
  status: string;
  createdAt: string | Date;
};

export function EscalationQueue({ items }: { items: Item[] }) {
  const router = useRouter();
  const groups = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;

  async function resolve(id: string) {
    await fetch(`/api/escalations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    router.refresh();
  }

  async function takeOver(id: string) {
    await fetch(`/api/escalations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HUMAN_HANDLED", takeOver: true }),
    });
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {groups.map((priority) => {
        const list = items.filter((item) => item.priority === priority);
        if (list.length === 0) return null;
        return (
          <section key={priority}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{priority}</h2>
            <ul className="flex flex-col gap-2">
              {list.map((item) => (
                <li key={item.id} className="panel p-4 text-sm">
                  <p className="font-medium">{item.reason}</p>
                  <p className="mt-1">{item.summary}</p>
                  {item.recommendation ? (
                    <p className="mt-1 text-[var(--muted)]">{item.recommendation}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.status}</p>
                  {item.status === "NEW" || item.status === "OPEN" ? (
                    <div className="mt-3 flex gap-2">
                      <button type="button" className="btn-primary text-xs" onClick={() => void takeOver(item.id)}>
                        Take over
                      </button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => void resolve(item.id)}>
                        Mark resolved
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
