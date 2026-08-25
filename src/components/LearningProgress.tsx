"use client";

const SKILL_LABELS: Record<string, string> = {
  price: "quoting prices",
  address: "taking addresses",
  quantity: "taking quantity",
  confirm_yes: "confirming orders",
  payment_done: "checking payment",
  greeting: "greeting customers",
  delivery_when: "promising delivery time",
};

export type LearningSnapshot = {
  humanReplies: number;
  aiSuccesses: number;
  skillsUnlocked: string[];
  readyForMore: boolean;
  total?: number;
};

export function LearningProgress({
  employeeName,
  learning,
}: {
  employeeName: string;
  learning: LearningSnapshot | null;
}) {
  const skills = (learning?.skillsUnlocked ?? [])
    .map((skill) => SKILL_LABELS[skill] ?? skill)
    .filter(Boolean);
  const human = learning?.humanReplies ?? 0;
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm">
      <p className="font-semibold">{employeeName} is learning from you</p>
      <p className="mt-1 text-[var(--muted)]">
        After you take over a chat, your reply is saved. {employeeName} uses those examples the next time a customer
        asks something similar — he does not retrain a new model, and prices still come only from your catalogue.
      </p>
      <p className="mt-2">
        Owner replies saved: <span className="font-medium">{human}</span>
        {skills.length > 0 ? (
          <>
            {" "}
            · Getting better at {skills.slice(0, 4).join(", ")}
          </>
        ) : (
          " · Take over once to start teaching him."
        )}
      </p>
    </div>
  );
}
