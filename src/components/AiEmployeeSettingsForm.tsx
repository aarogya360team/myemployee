"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AI_TONES,
  DAY_LABELS,
  DEFAULT_RESPONSIBILITIES,
  ESCALATE_LABELS,
  HANDLE_LABELS,
  LANGUAGE_LABELS,
  LANGUAGES,
  TONE_LABELS,
  type AiTone,
} from "@/lib/constants";
import {
  ADDRESS_FORM_LABELS,
  ADDRESS_FORMS,
  ATTIRE,
  ATTIRE_LABELS,
  EMPLOYEE_APPEARANCES,
  GREETING_LABELS,
  GREETINGS,
  PAUSE_FOR,
  PAUSE_LABELS,
  VERBOSITY,
  VERBOSITY_LABELS,
  type AddressForm,
  type Attire,
  type Greeting,
  type PauseFor,
  type Verbosity,
} from "@/lib/employee-identity";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";

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
    personality?: {
      attire?: string;
      addressForm?: string;
      greeting?: string;
      verbosity?: string;
      appearanceId?: string;
    };
    responsibilities: { handles: string[]; escalates: string[] };
  };
  hours: Hours[];
};

export function AiEmployeeSettingsForm({ employee, hours: initialHours }: Props) {
  const router = useRouter();
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [status, setStatus] = useState(employee.status);
  const [tone, setTone] = useState(employee.tone);
  const [languages, setLanguages] = useState<string[]>(employee.languages);
  const [handles, setHandles] = useState<string[]>(employee.responsibilities.handles);
  const [escalates, setEscalates] = useState<string[]>(employee.responsibilities.escalates);
  const [appearanceId, setAppearanceId] = useState(
    employee.personality?.appearanceId || employee.avatar || "rahul-formal",
  );
  const [attire, setAttire] = useState<Attire>((employee.personality?.attire as Attire) || "formal");
  const [addressForm, setAddressForm] = useState<AddressForm>(
    (employee.personality?.addressForm as AddressForm) || "aap",
  );
  const [greeting, setGreeting] = useState<Greeting>((employee.personality?.greeting as Greeting) || "namaste");
  const [verbosity, setVerbosity] = useState<Verbosity>(
    (employee.personality?.verbosity as Verbosity) || "short",
  );
  const [hours, setHours] = useState(initialHours);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/ai-employee", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        avatar: appearanceId,
        role,
        status,
        tone,
        languages,
        personality: { attire, addressForm, greeting, verbosity, appearanceId },
        workingHours: hours,
        responsibilities: { handles, escalates },
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <section className="panel p-5">
        <h2 className="font-semibold">Employee</h2>
        <div className="mt-3 mb-4 grid grid-cols-4 gap-2">
          {EMPLOYEE_APPEARANCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAppearanceId(item.id)}
              className={`overflow-hidden rounded-xl border ${appearanceId === item.id ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/30" : "border-[var(--line)]"}`}
            >
              <EmployeeAvatar avatar={item.id} name={item.suggestedName} size={64} />
            </button>
          ))}
        </div>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          Name
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          Role
          <input className="field" value={role} onChange={(e) => setRole(e.target.value)} />
        </label>
        <p className="mt-3 text-sm">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["WORKING", "HUMAN_ONLY", "OFFLINE"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`choice ${status === value ? "choice-active" : ""}`}
            >
              {value === "WORKING" ? "Working" : value === "HUMAN_ONLY" ? "I will handle customers" : "Offline"}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm">Pause</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAUSE_FOR.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value === "resume" ? "WORKING" : "PAUSED");
                void fetch("/api/ai-employee", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pauseFor: value as PauseFor }),
                }).then(() => router.refresh());
              }}
              className="choice"
            >
              {PAUSE_LABELS[value]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">How they speak</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {AI_TONES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTone(value)}
              className={`choice ${tone === value ? "choice-active" : ""}`}
            >
              {TONE_LABELS[value as AiTone]}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm">Look and address</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ATTIRE.map((value) => (
            <button key={value} type="button" onClick={() => setAttire(value)} className={`choice ${attire === value ? "choice-active" : ""}`}>
              {ATTIRE_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ADDRESS_FORMS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAddressForm(value)}
              className={`choice ${addressForm === value ? "choice-active" : ""}`}
            >
              {ADDRESS_FORM_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {GREETINGS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGreeting(value)}
              className={`choice ${greeting === value ? "choice-active" : ""}`}
            >
              {GREETING_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {VERBOSITY.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setVerbosity(value)}
              className={`choice ${verbosity === value ? "choice-active" : ""}`}
            >
              {VERBOSITY_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {LANGUAGES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={languages.includes(code)}
                onChange={() => toggle(languages, code, setLanguages)}
              />
              {LANGUAGE_LABELS[code]}
            </label>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">Working hours</h2>
        <div className="mt-3 flex flex-col gap-2">
          {hours.map((hour) => (
            <div key={hour.dayOfWeek} className="flex items-center gap-2 text-sm">
              <span className="w-20">{DAY_LABELS[hour.dayOfWeek].slice(0, 3)}</span>
              <input
                type="time"
                className="field !py-1"
                disabled={hour.closed}
                value={hour.openTime}
                onChange={(e) =>
                  setHours((prev) =>
                    prev.map((item) =>
                      item.dayOfWeek === hour.dayOfWeek
                        ? { ...item, openTime: e.target.value }
                        : item,
                    ),
                  )
                }
              />
              <input
                type="time"
                className="field !py-1"
                disabled={hour.closed}
                value={hour.closeTime}
                onChange={(e) =>
                  setHours((prev) =>
                    prev.map((item) =>
                      item.dayOfWeek === hour.dayOfWeek
                        ? { ...item, closeTime: e.target.value }
                        : item,
                    ),
                  )
                }
              />
              <label className="ml-auto flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={hour.closed}
                  onChange={(e) =>
                    setHours((prev) =>
                      prev.map((item) =>
                        item.dayOfWeek === hour.dayOfWeek
                          ? { ...item, closed: e.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Off
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">What they handle</h2>
        <div className="mt-3 flex flex-col gap-2">
          {DEFAULT_RESPONSIBILITIES.handles.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={handles.includes(item)}
                onChange={() => toggle(handles, item, setHandles)}
              />
              {HANDLE_LABELS[item]}
            </label>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">When they should ask you</h2>
        <div className="mt-3 flex flex-col gap-2">
          {DEFAULT_RESPONSIBILITIES.escalates.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={escalates.includes(item)}
                onChange={() => toggle(escalates, item, setEscalates)}
              />
              {ESCALATE_LABELS[item]}
            </label>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-700">Saved. {name} is up to date.</p> : null}
      <button className="btn-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
