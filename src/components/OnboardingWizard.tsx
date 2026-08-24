"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AI_NAME_SUGGESTIONS,
  AI_TONES,
  CATEGORY_LABELS,
  DAY_LABELS,
  LANGUAGE_LABELS,
  LANGUAGES,
  ONBOARD_CATEGORIES,
  TONE_LABELS,
  type AiTone,
} from "@/lib/constants";
import {
  ADDRESS_FORM_LABELS,
  ADDRESS_FORMS,
  ATTIRE,
  ATTIRE_LABELS,
  DEFAULT_PERSONALITY,
  EMPLOYEE_APPEARANCES,
  GREETING_LABELS,
  GREETINGS,
  appearanceById,
  type AddressForm,
  type Attire,
  type Greeting,
} from "@/lib/employee-identity";
import type { ChecklistItem, OnboardingJson, WhatsAppPath } from "@/lib/onboarding";
import { ConnectWhatsApp } from "@/components/ConnectWhatsApp";
import { ConversationTryout } from "@/components/ConversationTryout";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { GoLiveChecklist } from "@/components/SetupBanner";

type Hours = { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean };

type Initial = {
  created?: boolean;
  step?: number;
  json?: OnboardingJson;
  business?: { name: string; category: string; city: string | null; phone: string };
  employee?: { name: string; avatar: string | null } | null;
  hours?: Hours[];
  checklist?: ChecklistItem[];
  canGoLive?: boolean;
  productCount?: number;
  whatsappPath?: string | null;
};

export function OnboardingWizard({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [step, setStep] = useState(initial?.step ?? 1);
  const [created, setCreated] = useState(Boolean(initial?.created));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(initial?.business?.name ?? "");
  const [category, setCategory] = useState<(typeof ONBOARD_CATEGORIES)[number]>(
    (ONBOARD_CATEGORIES as readonly string[]).includes(initial?.business?.category ?? "")
      ? (initial!.business!.category as (typeof ONBOARD_CATEGORIES)[number])
      : "electrical_wholesaler",
  );
  const [city, setCity] = useState(initial?.business?.city ?? "");
  const [languages, setLanguages] = useState<string[]>(["hi", "en", "hinglish"]);
  const [aiName, setAiName] = useState(initial?.employee?.name ?? "Rahul");
  const [aiTone, setAiTone] = useState<AiTone>("friendly");
  const [appearanceId, setAppearanceId] = useState(initial?.employee?.avatar ?? "rahul-formal");
  const [attire, setAttire] = useState<Attire>(DEFAULT_PERSONALITY.attire);
  const [addressForm, setAddressForm] = useState<AddressForm>(DEFAULT_PERSONALITY.addressForm);
  const [greeting, setGreeting] = useState<Greeting>(DEFAULT_PERSONALITY.greeting);
  const [whatsappPath, setWhatsappPath] = useState<WhatsAppPath | null>(
    (initial?.whatsappPath as WhatsAppPath | undefined) ?? initial?.json?.whatsappPath ?? null,
  );
  const [sku, setSku] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [productCount, setProductCount] = useState(initial?.productCount ?? 0);
  const [maxPercent, setMaxPercent] = useState(5);
  const [ownerPhone, setOwnerPhone] = useState(initial?.business?.phone === "pending" ? "" : (initial?.business?.phone ?? ""));
  const [hours, setHours] = useState<Hours[]>(
    initial?.hours?.length === 7
      ? initial.hours
      : DAY_LABELS.map((_, dayOfWeek) => ({
          dayOfWeek,
          openTime: "09:00",
          closeTime: "19:00",
          closed: dayOfWeek === 0,
        })),
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? []);
  const [canLive, setCanLive] = useState(Boolean(initial?.canGoLive));

  const total = 9;
  const appearance = appearanceById(appearanceId);

  const canNext = useMemo(() => {
    if (step === 1) return name.trim().length >= 2 && city.trim().length >= 2 && languages.length > 0;
    if (step === 2) return aiName.trim().length >= 2;
    if (step === 3) return Boolean(whatsappPath);
    return true;
  }, [step, name, city, languages, aiName, whatsappPath]);

  function toggleLanguage(code: string) {
    setLanguages((prev) => (prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]));
  }

  async function persist(nextStep: number, json?: Partial<OnboardingJson>) {
    if (!created) return;
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: nextStep, json }),
    });
    if (res.ok) {
      const data = await res.json();
      setChecklist(data.checklist ?? []);
      setCanLive(Boolean(data.canGoLive));
      setProductCount(data.productCount ?? productCount);
    }
  }

  async function hire() {
    if (created) {
      setStep(3);
      await persist(3);
      return;
    }
    setPending(true);
    setError("");
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        city,
        defaultLanguage: languages.includes("hinglish") ? "hinglish" : languages[0],
        languages,
        aiEmployeeName: aiName,
        aiTone,
        avatar: appearanceId,
        personality: { attire, addressForm, greeting, appearanceId, verbosity: "short" },
        timezone: "Asia/Kolkata",
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not hire your employee.");
      return;
    }
    setCreated(true);
    setStep(3);
  }

  async function addProduct() {
    setPending(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku,
        name: productName,
        pricePaise: Math.round(Number(price) * 100),
        stock: Number(stock),
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not add that product. Use a unique SKU.");
      return;
    }
    setSku("");
    setProductName("");
    setPrice("");
    setStock("0");
    setProductCount((n) => n + 1);
  }

  async function saveRules() {
    await fetch("/api/business/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType: "DISCOUNT",
        condition: { maxPercentWithoutApproval: maxPercent },
        action: "ESCALATE",
        approvalRequired: true,
      }),
    });
    await persist(6, { rulesReviewed: true });
    setStep(6);
  }

  async function saveEscalation() {
    await fetch("/api/business/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        escalationRules: {
          refund: true,
          complaint: true,
          discountPercentOver: maxPercent,
          ownerPhone: ownerPhone || undefined,
        },
      }),
    });
    if (ownerPhone.trim().length >= 8) {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ownerPhone }),
      });
    }
    await persist(7, { escalationReviewed: true });
    setStep(7);
  }

  async function saveHours() {
    await fetch("/api/business/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours, defaultLanguage: languages.includes("hinglish") ? "hinglish" : languages[0], languagesEnabled: languages, aiTone }),
    });
    await persist(8, { languageReviewed: true });
    setStep(8);
  }

  async function markTested() {
    await persist(9, { testCompleted: true });
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { testCompleted: true } }),
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist ?? []);
        setCanLive(Boolean(data.canGoLive));
      }
    });
    setStep(9);
  }

  async function goLive() {
    setPending(true);
    setError("");
    const res = await fetch("/api/onboarding", { method: "POST" });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Finish the required setup steps first.");
      if (data.checklist) setChecklist(data.checklist);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Step {step} of {total}
      </p>
      <div className="mt-2 mb-6 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      {step === 1 ? (
        <Step title="Your business" hint="Name, type, city, and the languages customers already use.">
          <input className="field mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sharma Electricals" />
          <input className="field mb-3" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Delhi" />
          <div className="mb-3 grid grid-cols-1 gap-2">
            {ONBOARD_CATEGORIES.map((code) => (
              <button key={code} type="button" onClick={() => setCategory(code)} className={`choice ${category === code ? "choice-active" : ""}`}>
                {CATEGORY_LABELS[code]}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {LANGUAGES.map((code) => (
              <label key={code} className="choice flex items-center gap-3">
                <input type="checkbox" checked={languages.includes(code)} onChange={() => toggleLanguage(code)} />
                {LANGUAGE_LABELS[code]}
              </label>
            ))}
          </div>
        </Step>
      ) : null}

      {step === 2 ? (
        <Step title="Hire your AI employee" hint="This is who customers will talk to — not a chatbot.">
          <div className="mb-4 grid grid-cols-4 gap-2">
            {EMPLOYEE_APPEARANCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAppearanceId(item.id);
                  setAiName(item.suggestedName);
                }}
                className={`overflow-hidden rounded-xl border ${appearanceId === item.id ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/30" : "border-[var(--line)]"}`}
              >
                <EmployeeAvatar avatar={item.id} name={item.suggestedName} size={72} />
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {AI_NAME_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setAiName(suggestion)}
                className={`choice py-1.5 ${aiName === suggestion ? "choice-active" : ""}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <input className="field mb-4" value={aiName} onChange={(e) => setAiName(e.target.value)} />
          <p className="mb-2 text-sm">Tone</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {AI_TONES.map((tone) => (
              <button key={tone} type="button" onClick={() => setAiTone(tone)} className={`choice ${aiTone === tone ? "choice-active" : ""}`}>
                {TONE_LABELS[tone]}
              </button>
            ))}
          </div>
          <p className="mb-2 text-sm">How they should sound</p>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {ATTIRE.map((value) => (
              <button key={value} type="button" onClick={() => setAttire(value)} className={`choice ${attire === value ? "choice-active" : ""}`}>
                {ATTIRE_LABELS[value]}
              </button>
            ))}
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {ADDRESS_FORMS.map((value) => (
              <button key={value} type="button" onClick={() => setAddressForm(value)} className={`choice ${addressForm === value ? "choice-active" : ""}`}>
                {ADDRESS_FORM_LABELS[value]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GREETINGS.map((value) => (
              <button key={value} type="button" onClick={() => setGreeting(value)} className={`choice ${greeting === value ? "choice-active" : ""}`}>
                {GREETING_LABELS[value]}
              </button>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
            <EmployeeAvatar avatar={appearanceId} name={aiName} size={40} />
            You hired <strong>{aiName.trim() || appearance.suggestedName}</strong> — AI sales employee.
          </p>
        </Step>
      ) : null}

      {step === 3 ? (
        <Step title="WhatsApp" hint="Customers keep the number they already know. You will never paste technical IDs.">
          <ConnectWhatsApp path={whatsappPath} onPath={setWhatsappPath} />
        </Step>
      ) : null}

      {step === 4 ? (
        <Step title="Teach the catalogue" hint="Your employee will only quote prices from this list. Skip and add later if you need to.">
          <div className="grid gap-2">
            <input className="field" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
            <input className="field" placeholder="Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
            <input className="field" placeholder="Dealer price ₹" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="field" placeholder="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            <button type="button" className="btn-secondary" disabled={pending || !sku || !productName || !price} onClick={() => void addProduct()}>
              Add product
            </button>
            <p className="text-sm text-[var(--muted)]">{productCount} products in the catalogue.</p>
          </div>
        </Step>
      ) : null}

      {step === 5 ? (
        <Step title="Rules" hint="Your employee cannot go beyond this. Change it any time.">
          <label className="flex flex-col gap-1 text-sm">
            Discount without asking you (%)
            <input className="field" type="number" min={0} max={40} value={maxPercent} onChange={(e) => setMaxPercent(Number(e.target.value))} />
          </label>
          <p className="mt-3 text-sm text-[var(--muted)]">Credit, refunds, and angry customers always come to you.</p>
        </Step>
      ) : null}

      {step === 6 ? (
        <Step title="When to call you" hint="Your employee brings you in for judgment. Give the number that should ring.">
          <input className="field" inputMode="tel" placeholder="Owner mobile" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
        </Step>
      ) : null}

      {step === 7 ? (
        <Step title="Hours" hint="Sunday closed is common. Change what you need.">
          <div className="flex flex-col gap-2">
            {hours.map((hour) => (
              <div key={hour.dayOfWeek} className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm">
                <span className="w-20 shrink-0">{DAY_LABELS[hour.dayOfWeek].slice(0, 3)}</span>
                <input
                  type="time"
                  className="field !py-1"
                  disabled={hour.closed}
                  value={hour.openTime}
                  onChange={(e) =>
                    setHours((prev) => prev.map((item) => (item.dayOfWeek === hour.dayOfWeek ? { ...item, openTime: e.target.value } : item)))
                  }
                />
                <input
                  type="time"
                  className="field !py-1"
                  disabled={hour.closed}
                  value={hour.closeTime}
                  onChange={(e) =>
                    setHours((prev) => prev.map((item) => (item.dayOfWeek === hour.dayOfWeek ? { ...item, closeTime: e.target.value } : item)))
                  }
                />
                <label className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={hour.closed}
                    onChange={(e) =>
                      setHours((prev) => prev.map((item) => (item.dayOfWeek === hour.dayOfWeek ? { ...item, closed: e.target.checked } : item)))
                    }
                  />
                  Off
                </label>
              </div>
            ))}
          </div>
        </Step>
      ) : null}

      {step === 8 ? (
        <Step title="Test your employee" hint="This is a DEMO conversation. It never sends a live WhatsApp message.">
          <ConversationTryout employeeName={aiName} demo />
        </Step>
      ) : null}

      {step === 9 ? (
        <Step title="Go live" hint="Required steps must be done. WhatsApp can stay disconnected — testing still works here.">
          <GoLiveChecklist items={checklist} />
        </Step>
      ) : null}

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mt-auto flex gap-2 pt-8">
        {step > 1 ? (
          <button type="button" className="btn-secondary flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : null}
        {step === 2 ? (
          <button type="button" className="btn-primary flex-1" disabled={!canNext || pending} onClick={() => void hire()}>
            {pending ? "Hiring…" : `Hire ${aiName || "employee"}`}
          </button>
        ) : null}
        {step === 4 ? (
          <>
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => void persist(5, { catalogueSkipped: productCount === 0 }).then(() => setStep(5))}
            >
              Skip for now
            </button>
            <button type="button" className="btn-primary flex-1" onClick={() => void persist(5).then(() => setStep(5))}>
              Next
            </button>
          </>
        ) : null}
        {step === 5 ? (
          <button type="button" className="btn-primary flex-1" onClick={() => void saveRules()}>
            Next
          </button>
        ) : null}
        {step === 6 ? (
          <button type="button" className="btn-primary flex-1" onClick={() => void saveEscalation()}>
            Next
          </button>
        ) : null}
        {step === 7 ? (
          <button type="button" className="btn-primary flex-1" onClick={() => void saveHours()}>
            Next
          </button>
        ) : null}
        {step === 8 ? (
          <button type="button" className="btn-primary flex-1" onClick={() => void markTested()}>
            I&apos;ve tested — continue
          </button>
        ) : null}
        {step === 9 ? (
          <button type="button" className="btn-primary flex-1" disabled={pending || !canLive} onClick={() => void goLive()}>
            {pending ? "Going live…" : "Go live with your employee"}
          </button>
        ) : null}
        {step === 1 || step === 3 ? (
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={!canNext}
            onClick={() => {
              if (step === 3) void persist(4);
              setStep((s) => s + 1);
            }}
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Step({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 mb-5 text-sm text-[var(--muted)]">{hint}</p>
      {children}
    </div>
  );
}
