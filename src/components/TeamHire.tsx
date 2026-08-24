"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WorkforceTemplate } from "@/lib/usp/workforce";

type Hired = { id: string; name: string; role: string; workforceRole: string; status: string };

export function TeamHire({
  employees,
  templates,
  seatsUsed,
  seatLimit,
  planCode,
}: {
  employees: Hired[];
  templates: WorkforceTemplate[];
  seatsUsed: number;
  seatLimit: number;
  planCode: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function hire(key: WorkforceTemplate["key"]) {
    setPending(key);
    setError("");
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    setPending(null);
    if (!res.ok) {
      setError(data.error ?? "Could not hire this employee.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">
        Plan {planCode}: {seatsUsed}/{seatLimit} AI employee seats. Extra hires need a higher plan or an extra-employee add-on.
      </p>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {employees.map((employee) => (
          <li key={employee.id} className="panel px-4 py-3 text-sm">
            <p className="font-semibold">{employee.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {employee.role} · {employee.workforceRole} · {employee.status}
            </p>
          </li>
        ))}
      </ul>
      <h2 className="mt-2 text-sm font-medium text-[var(--muted)]">Hire</h2>
      <ul className="flex flex-col gap-2">
        {templates.map((template) => {
          const hired = employees.some((e) => e.workforceRole === template.role || e.name === template.name);
          return (
            <li key={template.key} className="panel p-4 text-sm">
              <p className="font-semibold">
                {template.name} · {template.title}
              </p>
              <p className="text-xs text-[var(--muted)]">Needs {template.minPlan}. {template.responsibilities[0]}</p>
              <button
                className="btn-primary mt-3 px-4 py-2 text-sm"
                type="button"
                disabled={hired || pending != null}
                onClick={() => void hire(template.key)}
              >
                {hired ? "Already on duty" : pending === template.key ? "Hiring…" : `Hire ${template.name}`}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
