import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import Link from "next/link";
import {
  DAY_LABELS,
  ESCALATE_LABELS,
  HANDLE_LABELS,
  LANGUAGE_LABELS,
  TONE_LABELS,
  type AiTone,
  type AppLanguage,
} from "@/lib/constants";

type Hours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
};

type Props = {
  employee: {
    name: string;
    avatar: string | null;
    role: string;
    status: string;
    languages: string[];
    tone: string;
    responsibilities: { handles: string[]; escalates: string[] };
  };
  stats: {
    conversations: number;
    orders: number;
    invoices: number;
    followUps: number;
  };
  hours: Hours[];
  businessName: string;
};

function statusLabel(status: string) {
  if (status === "WORKING") return "Working";
  if (status === "PAUSED") return "On a break";
  if (status === "HUMAN_ONLY") return "You are handling customers";
  if (status === "SETUP_REQUIRED") return "Setup";
  return "Offline";
}

export function AiEmployeeProfile({ employee, stats, hours, businessName }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <section className="panel p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <EmployeeAvatar avatar={employee.avatar} name={employee.name} size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
            <p className="text-sm text-[var(--muted)]">{employee.role}</p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--paper)] px-2.5 py-1 text-xs font-medium">
              <span
                className={`size-2 rounded-full ${
                  employee.status === "WORKING" ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              {statusLabel(employee.status)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          {employee.languages
            .map((code) => LANGUAGE_LABELS[code as AppLanguage] ?? code)
            .join(" • ")}
        </p>
        <p className="mt-1 text-sm">Works for {businessName}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/customers" className="btn-secondary text-sm">
            Customer memory
          </Link>
          <Link href="/app/rules" className="btn-secondary text-sm">
            Set {employee.name}&apos;s rules
          </Link>
          <Link href="/ai-employee/settings" className="btn-secondary text-sm">
            Give {employee.name} access
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">Today</h2>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Enquiries" value={stats.conversations} />
          <Stat label="Orders" value={stats.orders} />
          <Stat label="Invoices" value={stats.invoices} />
          <Stat label="Follow-ups" value={stats.followUps} />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">What {employee.name} handles</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {employee.responsibilities.handles.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-emerald-600">✓</span>
              {HANDLE_LABELS[item] ?? item}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">When {employee.name} asks you</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {employee.responsibilities.escalates.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[var(--accent)]">✓</span>
              {ESCALATE_LABELS[item] ?? item}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">Current activity</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {stats.conversations === 0
            ? `${employee.name} is ready. No customer conversations yet.`
            : `${employee.name} is handling today’s customers.`}
        </p>
        <p className="mt-2 text-sm">
          Tone: {TONE_LABELS[employee.tone as AiTone] ?? employee.tone}
        </p>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">Recent work</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Nothing to show yet. Orders, invoices and follow-ups will appear here once customers start talking to {employee.name}.
        </p>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">Performance</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          We’ll show how much routine work {employee.name} takes off your plate after the first conversations.
        </p>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">Working hours</h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {hours.map((hour) => (
            <li key={hour.dayOfWeek} className="flex justify-between">
              <span>{DAY_LABELS[hour.dayOfWeek]}</span>
              <span className="text-[var(--muted)]">
                {hour.closed ? "Closed" : `${hour.openTime}–${hour.closeTime}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}
