"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Rule = {
  id: string;
  ruleType: string;
  priority: number;
  condition: Record<string, unknown>;
  action: string;
  approvalRequired: boolean;
  enabled: boolean;
};

export function BusinessBrainForm({ employeeName, rules: initial }: { employeeName: string; rules: Rule[] }) {
  const router = useRouter();
  const discount = initial.find((r) => r.ruleType === "DISCOUNT");
  const credit = initial.find((r) => r.ruleType === "CREDIT");
  const payment = initial.find((r) => r.ruleType === "PAYMENT");
  const delivery = initial.find((r) => r.ruleType === "DELIVERY");
  const hours = initial.find((r) => r.ruleType === "HOURS");
  const phrase = initial.find((r) => r.ruleType === "PHRASE");
  const [maxPercent, setMaxPercent] = useState(Number(discount?.condition.maxPercentWithoutApproval ?? 5));
  const [allowCredit, setAllowCredit] = useState(credit?.condition.allowWithoutApproval === true);
  const [collectBeforeDelivery, setCollectBeforeDelivery] = useState(
    payment?.condition.collectBeforeDelivery !== false,
  );
  const [bookOnlyAfterPayment, setBookOnlyAfterPayment] = useState(
    delivery?.condition.bookOnlyAfterPayment !== false,
  );
  const [workOutsideHours, setWorkOutsideHours] = useState(hours?.condition.workOutsideHours === true);
  const [phrases, setPhrases] = useState(
    Array.isArray(phrase?.condition.approved) ? (phrase?.condition.approved as string[]).join(", ") : "",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function patch(id: string | undefined, condition: Record<string, unknown>, extra?: { ruleType: string }) {
    if (id) {
      const res = await fetch("/api/business/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, condition }),
      });
      return res;
    }
    if (!extra) return new Response(null, { status: 400 });
    return fetch("/api/business/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleType: extra.ruleType, condition }),
    });
  }

  async function save() {
    setPending(true);
    setError("");
    const approved = phrases
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const results = await Promise.all([
      patch(discount?.id, { maxPercentWithoutApproval: maxPercent }, { ruleType: "DISCOUNT" }),
      patch(credit?.id, { allowWithoutApproval: allowCredit }, { ruleType: "CREDIT" }),
      patch(payment?.id, { collectBeforeDelivery }, { ruleType: "PAYMENT" }),
      patch(delivery?.id, { bookOnlyAfterPayment }, { ruleType: "DELIVERY" }),
      patch(hours?.id, { workOutsideHours }, { ruleType: "HOURS" }),
      patch(phrase?.id, { approved }, { ruleType: "PHRASE" }),
    ]);
    setPending(false);
    if (results.some((res) => !res.ok)) {
      setError("Could not save rules.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="panel p-4 text-sm">
        Never give more than this discount without owner approval
        <input
          className="field mt-2"
          type="number"
          min={0}
          max={100}
          value={maxPercent}
          onChange={(e) => setMaxPercent(Number(e.target.value))}
        />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          If a customer asks for more, {employeeName} escalates.
        </span>
      </label>
      <label className="flex items-center gap-2 panel p-4 text-sm">
        <input type="checkbox" checked={allowCredit} onChange={(e) => setAllowCredit(e.target.checked)} />
        Allow credit terms without owner approval
      </label>
      <label className="flex items-center gap-2 panel p-4 text-sm">
        <input
          type="checkbox"
          checked={collectBeforeDelivery}
          onChange={(e) => setCollectBeforeDelivery(e.target.checked)}
        />
        Collect payment before delivery
      </label>
      <label className="flex items-center gap-2 panel p-4 text-sm">
        <input
          type="checkbox"
          checked={bookOnlyAfterPayment}
          onChange={(e) => setBookOnlyAfterPayment(e.target.checked)}
        />
        Book delivery only after payment is confirmed
      </label>
      <label className="flex items-center gap-2 panel p-4 text-sm">
        <input type="checkbox" checked={workOutsideHours} onChange={(e) => setWorkOutsideHours(e.target.checked)} />
        {employeeName} may work outside shop hours
      </label>
      <label className="panel p-4 text-sm">
        Approved phrases (comma separated)
        <input className="field mt-2" value={phrases} onChange={(e) => setPhrases(e.target.value)} />
      </label>
      <ul className="panel p-4 text-sm">
        {initial.map((rule) => (
          <li key={rule.id} className="border-b border-[var(--line)] py-2 last:border-0">
            <span className="font-medium">{rule.ruleType}</span> → {rule.action}
            {rule.approvalRequired ? " · approval required" : ""}
            {rule.enabled ? "" : " · off"}
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn-primary" type="button" disabled={pending} onClick={() => void save()}>
        {pending ? "Saving…" : `Give ${employeeName} these rules`}
      </button>
    </div>
  );
}
