"use client";

import { useMemo, useState } from "react";
import { PLAN_CATALOG, formatInr } from "@/lib/billing/catalog";
import { ESTIMATE_LABEL } from "@/lib/usp/positioning";
import { calculateRoi, ROI_DISCLAIMER, type RoiInputs } from "@/lib/usp/roi";

const DEFAULTS: RoiInputs = {
  monthlyEnquiries: 1000,
  averageOrderValuePaise: 500000,
  currentConversionRate: 0.08,
  estimatedConversionRate: 0.12,
  employeeCostPaise: PLAN_CATALOG.find((p) => p.code === "BUSINESS")?.monthlyPaise ?? 349900,
};

export function RoiCalculator() {
  const [enquiries, setEnquiries] = useState(DEFAULTS.monthlyEnquiries);
  const [aov, setAov] = useState(DEFAULTS.averageOrderValuePaise / 100);
  const [current, setCurrent] = useState(8);
  const [improved, setImproved] = useState(12);
  const estimate = useMemo(
    () =>
      calculateRoi({
        monthlyEnquiries: enquiries,
        averageOrderValuePaise: Math.round(aov * 100),
        currentConversionRate: current / 100,
        estimatedConversionRate: improved / 100,
        employeeCostPaise: DEFAULTS.employeeCostPaise,
      }),
    [enquiries, aov, current, improved],
  );

  return (
    <section id="roi" className="panel p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{ESTIMATE_LABEL}</p>
      <h2 className="mt-1 text-2xl font-semibold">What could this mean in rupees?</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{ROI_DISCLAIMER}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Monthly WhatsApp enquiries" value={enquiries} onChange={setEnquiries} />
        <Field label="Average order value (₹)" value={aov} onChange={setAov} />
        <Field label="Current conversion %" value={current} onChange={setCurrent} />
        <Field label="If conversion becomes %" value={improved} onChange={setImproved} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result
          title="Current"
          lines={[
            `${Math.round(estimate.currentOrders)} orders`,
            formatInr(estimate.currentRevenuePaise),
          ]}
        />
        <Result
          title="If conversion improves"
          lines={[
            `${Math.round(estimate.potentialOrders)} orders`,
            formatInr(estimate.potentialRevenuePaise),
          ]}
        />
      </div>
      <p className="mt-4 text-sm">
        Potential additional revenue: <strong>{formatInr(estimate.additionalRevenuePaise)}</strong>
      </p>
      <p className="mt-1 text-sm">
        AI employee (Business plan): <strong>{formatInr(estimate.employeeCostPaise)}/month</strong>
      </p>
      <p className="mt-1 text-sm">
        Potential revenue multiple:{" "}
        <strong>
          {estimate.revenueMultiple != null && Number.isFinite(estimate.revenueMultiple)
            ? `${Math.round(estimate.revenueMultiple)}x`
            : "—"}
        </strong>{" "}
        <span className="text-[var(--muted)]">({ESTIMATE_LABEL})</span>
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        className="field mt-1"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Result({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-lg font-semibold">
          {line}
        </p>
      ))}
    </div>
  );
}
